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
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from '../stores/auth-store';
import { Loader } from "../components/LazyLoaders/loader";
import { isEmail, isRequired } from "../utils/validations/validation";

// Define the types for route and navigation
// Note: The screen name here must match the one in AppNavigator.tsx
type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signInWithPassword } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerTintColor: "#fff",
    });
  }, [navigation]);

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};

    if (!isRequired(email)) {
      newErrors.email = "Email is required";
    } else if (!isEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isRequired(password)) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        // Use Alert for server-side/authentication errors, not validation
        Alert.alert("Login Error", error.message);
        setIsLoading(false);
      } else {
        // Check role before navigating back.
        // If Admin/SuperAdmin, App.tsx will swap navigators, unmounting this screen.
        // calling goBack() on an unmounting navigator causes the "GO_BACK not handled" error.
        const currentUser = useAuth.getState().user;
        const role = currentUser?.app_metadata?.role;

        // Only go back if it's a normal user. 
        // Admins get redirected by the root navigator automatically.
        if (role !== 'admin' && role !== 'super_admin') {
             if (navigation.canGoBack()) {
                navigation.goBack();
             }
        }
        // Note: We don't set isLoading(false) here because the component will unmount/remount
      }
    } catch (err) {
       setIsLoading(false);
       console.error(err);
    }
  };
  
  // Handlers to clear errors on input change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
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
          <View style={styles.headerWrapper}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerText}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>
          </LinearGradient>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.fieldContainer}>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              <View style={[styles.inputContainer, errors.email ? styles.errorInputContainer : null]}>
                <View style={styles.inputIcon}>
                  <Icon name="mail-outline" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <View style={[styles.inputContainer, errors.password ? styles.errorInputContainer : null]}>
                <View style={styles.inputIcon}>
                  <Icon name="lock-closed-outline" size={20} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={handlePasswordChange}
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Conditional rendering for the button/loader */}
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <Loader size={120} />
              ) : (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6"]}
                    style={styles.loginButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupLink}>Sign Up</Text>
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

  headerWrapper: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  header: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerText: {
    backgroundColor: "transparent",
    marginVertical: Platform.OS === "ios" ? 120 : 100,
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
    flex: 0,
    padding: 24,
    marginVertical: -60
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
    borderColor: 'transparent',
  },
  errorInputContainer: {
    borderColor: '#ff4757',
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
    color: '#ff4757',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  buttonContainer: {
    height: 50, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%', 
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    alignItems: "center",
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    width: '100%',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#666",
  },
  signupLink: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
});