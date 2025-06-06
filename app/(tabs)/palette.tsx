import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAyaStore } from "../../lib/store";

const baseURL = "https://palette-backend-hqcb.onrender.com";

export default function PaletteImageScreen() {
  const router = useRouter();
  const paletteImage = useAyaStore((state) => state.paletteImage);
  const setPaletteImage = useAyaStore((state) => state.setPaletteImage);
  const palette = useAyaStore((state) => state.palette);
  const setPalette = useAyaStore((state) => state.setPalette);
  const baseImage = useAyaStore((state) => state.baseImage);
  const setRecolorResult = useAyaStore((state) => state.setRecolorResult);
  const [loading, setLoading] = useState(false);

  const pickPaletteImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      base64: true,
      quality: 1,
    });

    if (!result.canceled) {
      const picked = result.assets[0];
      setPaletteImage(picked);
      if (picked.base64) {
        extractPalette(picked.base64);
      } else {
        console.warn("No base64 found on selected image");
      }
    }
  };

  const extractPalette = async (base64Image: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/palette`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const json = await response.json();
      setPalette(json.palette);
    } catch (error) {
      console.error("Palette extraction error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecolor = async () => {
    if (!baseImage?.base64 || palette.length === 0) {
      alert("Please select both images");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/recolor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: baseImage.base64,
          palette: palette,
        }),
      });
      const json = await response.json();
      setRecolorResult(json.recolor);
      router.push("/result");
    } catch (error) {
      console.error("Recolor error:", error);
      alert("Failed to recolor image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AYA</Text>

      <TouchableOpacity
        style={[styles.circleButton, paletteImage && styles.undoButton]}
        onPress={paletteImage ? () => setPaletteImage(null) : pickPaletteImage}
      >
        {paletteImage ? (
          <MaterialIcons name="undo" size={24} color="#3f51b5" />
        ) : (
          <Text style={styles.plus}>+</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.subtext}>Pick a palette image</Text>

      {paletteImage && (
        <Image
          source={{ uri: paletteImage.uri }}
          style={styles.image}
          resizeMode="contain"
        />
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color="#3f51b5"
          style={{ marginVertical: 20 }}
        />
      )}

      {palette.length > 0 && (
        <View style={styles.paletteBox}>
          <View style={styles.paletteHeader}>
            <Text style={styles.sectionTitle}>Extracted Palette</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(palette.join(", "));
                Toast.show({
                  type: "success",
                  text1: "Copied!",
                  text2: "Palette saved to clipboard 🎨",
                  position: "bottom",
                });
              }}
            >
              <MaterialIcons name="content-copy" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>

          <View style={styles.swatchRow}>
            {palette.map((hex, index) => (
              <View key={index} style={styles.swatchBlock}>
                <View style={[styles.swatch, { backgroundColor: hex }]} />
                <Text style={styles.hexText}>{hex}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {palette.length > 0 && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => router.replace("/")}
          >
            <LinearGradient
              colors={["#0648a4", "#5337a5"]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientButton}
            >
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.buttonText}>Back </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRecolor}
          >
            <LinearGradient
              colors={["#ff416c", "#7f00ff"]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Recolor</Text>
              {/* <MaterialIcons name="arrow-forward" size={20} color="#fff" /> */}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 40,
  },
  subtext: {
    color: "#777",
    fontSize: 16,
    marginBottom: 20,
  },
  circleButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  plus: {
    fontSize: 40,
    color: "#777",
  },
  undoButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderColor: "#888",
    marginBottom: 16,
  },
  image: {
    width: 240,
    height: 240,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    gap: 12,
  },
  controlButton: {
    flex: 1,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 32,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  paletteBox: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    minWidth: 350,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  swatchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
    flexWrap: "nowrap",
  },
  swatchBlock: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  hexText: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 4,
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  paletteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  copyIcon: {
    fontSize: 18,
    color: "#ccc",
    paddingHorizontal: 10,
  },
});
