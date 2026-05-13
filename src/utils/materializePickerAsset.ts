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
  return 'jpg';
}

/**
 * Garante um URI que o `ImageManipulator` consegue abrir de forma fiável.
 *
 * - Se o picker já devolveu `file://` (caso típico na galeria Android), **reutiliza esse URI**.
 * - Só grava a partir de `base64` quando o URI ainda é problemático (`content://`, `ph://`, …)
 *   ou, com `preferBase64`, quando não há caminho local utilizável (ex.: `blob:` na web).
 */
export async function materializePickerAsset(
  asset: ImagePickerAsset,
  opts: { preferBase64?: boolean } = {},
): Promise<string> {
  const { preferBase64 = false } = opts;
  const { uri, base64 } = asset;
  if (!FileSystem.cacheDirectory) return uri;

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
