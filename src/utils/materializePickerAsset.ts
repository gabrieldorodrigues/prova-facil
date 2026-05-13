import * as FileSystem from 'expo-file-system/legacy';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

/** URIs que o pipeline nativo de imagem costuma não abrir bem sem cópia local. */
export function pickerAssetUriNeedsMaterialize(uri: string): boolean {
  const u = uri.toLowerCase();
  if (u.startsWith('content://')) return true;
  if (u.startsWith('ph://')) return true;
  if (Platform.OS === 'android' && !u.startsWith('file:')) return true;
  return false;
}

/**
 * No Android (e na maior parte dos casos no iOS), o `expo-image-picker` já grava a imagem
 * num ficheiro em cache (`file://…` com extensão .jpg/.png) antes de devolver o asset.
 * Não devemos regravar esse mesmo pixel data para `*.bin`: o `ImageManipulator` depende do
 * formato real e o preview (`Image`) tolera melhor ficheiros sem extensão correta.
 */
function hasResolvableLocalFilePath(uri: string): boolean {
  return uri.trim().toLowerCase().startsWith('file:');
}

function extensionFromMime(mimeType: string | undefined | null): string {
  const m = (mimeType || '').toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('heic') || m.includes('heif')) return 'heic';
  return 'jpg';
}

/** Extensão útil para o manipulator, a partir do path ou do MIME. */
function extensionFromUriOrMime(uri: string, mimeType: string | undefined | null): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return extensionFromMime(mimeType);
}

/**
 * Garante um URI que o `ImageManipulator` consegue abrir de forma fiável.
 *
 * - **iOS + galeria (`preferBase64`)**: copia o ficheiro já exportado pelo picker para a cache
 *   do `expo-file-system`. No Expo Go o ficheiro fica em `…/ImagePicker/` e o manipulator
 *   por vezes falha a ler esse path embora o `Image` no preview funcione.
 * - **Android + galeria**: reutiliza o `file://` que o picker já gravou (evita regravação `.bin`).
 * - Grava a partir de `base64` só quando o URI ainda é problemático ou não há `file:` (ex.: web).
 */
export async function materializePickerAsset(
  asset: ImagePickerAsset,
  opts: { preferBase64?: boolean } = {},
): Promise<string> {
  const { preferBase64 = false } = opts;
  const { uri, base64 } = asset;
  if (!FileSystem.cacheDirectory) return uri;

  if (
    preferBase64 &&
    Platform.OS === 'ios' &&
    hasResolvableLocalFilePath(uri)
  ) {
    const ext = extensionFromUriOrMime(uri, asset.mimeType);
    const out = `${FileSystem.cacheDirectory}pf-ios-pick-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    try {
      await FileSystem.copyAsync({ from: uri, to: out });
      return out;
    } catch {
      if (base64) {
        await FileSystem.writeAsStringAsync(out, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return out;
      }
    }
  }

  const shouldWriteBase64 =
    !!base64 &&
    (pickerAssetUriNeedsMaterialize(uri) ||
      (preferBase64 && !hasResolvableLocalFilePath(uri)));

  if (shouldWriteBase64) {
    const ext = extensionFromMime(asset.mimeType);
    const out = `${FileSystem.cacheDirectory}pf-pick-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    await FileSystem.writeAsStringAsync(out, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return out;
  }

  if (pickerAssetUriNeedsMaterialize(uri)) {
    const out = `${FileSystem.cacheDirectory}pf-copy-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.jpg`;
    try {
      await FileSystem.copyAsync({ from: uri, to: out });
      return out;
    } catch {
      return uri;
    }
  }

  return uri;
}
