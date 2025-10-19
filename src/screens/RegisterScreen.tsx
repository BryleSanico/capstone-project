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
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/FontAwesome";
import { useAuth } from "../stores/auth-store";
import { Loader } from "../components/loaders/loader";
import {
  isEmail,
  isRequired,
  minLength,
  passwordsMatch,
} from "../utils/validation";

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
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerTintColor: "#fff",
    });
  }, [navigation]);

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    if (!isRequired(name)) newErrors.name = "Full name is required";
    if (!isRequired(email)) newErrors.email = "Email is required";
    else if (!isEmail(email)) newErrors.email = "Please enter a valid email";
    if (!isRequired(password)) newErrors.password = "Password is required";
    else if (!minLength(password, 6))
      newErrors.password = "Password must be at least 6 characters";
    if (!passwordsMatch(password, confirmPassword))
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(name, email, password);
      if (error) {
        Alert.alert("Registration Error", error.message);
      } else {
        Alert.alert(
          "Success!",
          "Please check your email for a confirmation link to complete registration.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createChangeHandler =
    (setter: (text: string) => void, fieldName: string) => (text: string) => {
      setter(text);
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
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
            <View style={styles.fieldContainer}>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  errors.name ? styles.errorInputContainer : null,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon2 name="user-o" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={createChangeHandler(setName, "name")}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  errors.email ? styles.errorInputContainer : null,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon name="mail-outline" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={createChangeHandler(setEmail, "email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  errors.password ? styles.errorInputContainer : null,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon name="lock-closed-outline" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={createChangeHandler(setPassword, "password")}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
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
            </View>

            <View style={styles.fieldContainer}>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword ? styles.errorInputContainer : null,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Icon name="lock-closed-outline" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={createChangeHandler(
                    setConfirmPassword,
                    "confirmPassword"
                  )}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
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
            </View>

            <View style={styles.buttonContainer}>
              {isLoading ? (
                <Loader size={120} />
              ) : (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6"]}
                    style={styles.registerButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.registerButtonText}>
                      Create Account
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

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
  fieldContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "transparent",
  },
  errorInputContainer: {
    borderColor: "#ff4757",
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
  errorText: {
    color: "#ff4757",
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  registerButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
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
    justifyContent: "center",
    width: "100%",
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
