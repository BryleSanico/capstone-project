import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/FontAwesome";
import { supabase } from "@/src/lib/supabase"; 

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<RegisterScreenNavigationProp>();

    useLayoutEffect(() => {
      navigation.setOptions({
        title: '',
        headerTransparent: true,
        headerTintColor: '#fff',
      });
    }, [navigation]);
  
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    setLoading(false);
    if (error) {
      Alert.alert("Registration Error", error.message);
    } else {
      Alert.alert(
        "Success!",
        "Please check your email for a confirmation link to complete registration.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerText}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon2 name="user-o" size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon name="mail-outline" size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon name="lock-closed-outline" size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Icon name="eye-off" size={20} color="#666" />
                ) : (
                  <Icon name="eye" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icon name="lock-closed-outline" size={20} color="#666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <Icon name="eye-off" size={20} color="#666" />
                ) : (
                  <Icon name="eye" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: 80,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerText: {
    backgroundColor: "transparent",
    marginTop: 100,
    marginBottom: 80,
    marginLeft: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  formContainer: {
    flex: 1,
    padding: 24,
    marginTop: -120,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonGradient: {
    alignItems: "center",
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
});
