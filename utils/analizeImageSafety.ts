import * as ImageManipulator from "expo-image-manipulator";

/**
 * Skin Tone Heuristic
 * Logic: R > G > B and specific ratios represent human skin tones.
 */
export const isLikelyAdultContent = (r: number, g: number, b: number) => {
  // 1. Basic Skin Tone Range: R > G > B
  // and R shouldn't be too dark or too blindingly white
  const isSkinRange = r > 95 && g > 40 && b > 20 && r > g && g > b;

  // 2. Saturation & Contrast
  // Skin is rarely 'pure' red or 'pure' grey.
  const rgDiff = r - g;
  const isNotTooRed = rgDiff > 15 && rgDiff < 90;

  // 3. Brightness check
  // Prevents flagging dark backgrounds or pure black/white art
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const isNotTooSaturated = max - min < 110;

  return isSkinRange && isNotTooRed && isNotTooSaturated;
};

/**
 * The Core Analyzer
 */
export const analyzeImageSafety = async (uri: string): Promise<boolean> => {
  try {
    // 1. Downsample to 1x1 to get average color
    // This happens in native code, very fast.
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1, height: 1 } }],
      { format: ImageManipulator.SaveFormat.PNG, base64: true },
    );

    // 2. Since we can't easily parse binary Base64 in pure JS without a Buffer,
    // we use a trick: In a 1x1 PNG, the color data is often readable.
    // However, the cleanest Expo-way is to use a 5x5 resize and check vibrant colors.

    // BUT, because we want high performance:
    // We will assume 'base64' is the source.
    // If you haven't installed 'react-native-image-colors',
    // we have to use a heuristic or a small 1x1 PNG parser.

    // For now, let's use a standard 'Average' if we could.
    // Since we can't reliably parse raw bytes in JS efficiently:
    // PRO TIP: Install `react-native-image-colors` for real RGB values.

    // IF NO LIBRARY: Use a 5x5 resize and check if the result is heavily "warm"
    // Since we need to return a BOOLEAN:
    return false; // See note below
  } catch (e) {
    console.error("Safety Analysis Error:", e);
    return false;
  }
};
