// jest.setup.js
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// // Silence the warning about "useNativeDriver" in tests
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// // Mock react-native-dotenv
// jest.mock('@env', () => ({
//   SUPABASE_URL: 'mock-supabase-url.com',
//   SUPABASE_ANON_KEY: 'mock-supabase-anon-key',
// }));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
  addEventListener: jest.fn(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: { PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY' },
    ANDROID: {
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    LIMITED: 'limited',
    UNAVAILABLE: 'unavailable',
  },
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock react-native-quick-base64
jest.mock('react-native-quick-base64', () => ({
  toByteArray: jest.fn((base64) => new Uint8Array(Buffer.from(base64, 'base64'))),
}));

// Mock Firebase
jest.mock('@react-native-firebase/messaging', () => () => ({
  getMessaging: jest.fn(),
  hasPermission: jest.fn(() => Promise.resolve(1)), // 1 = AUTHORIZED
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  onTokenRefresh: jest.fn(() => jest.fn()), // Returns an unsubscribe function
  onMessage: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/app', () => ({
  getApps: jest.fn(() => [true]), // Simulate app is initialized
  getApp: jest.fn(() => ({})),
}));

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve()),
  displayNotification: jest.fn(() => Promise.resolve()),
  requestPermission: jest.fn(() =>
    Promise.resolve({ authorizationStatus: 1 })
  ),
  getNotificationSettings: jest.fn(() =>
    Promise.resolve({ authorizationStatus: 1 })
  ),
  AndroidImportance: { HIGH: 4 },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 0,
    NOT_DETERMINED: -1,
  },
}));

// Mock other simple native modules
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
}));
jest.mock('react-native-url-polyfill/auto', () => {});
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));
jest.mock('react-native-qrcode-svg', () => 'QRCode');


// Create stable mock functions
const mockStorageUpload = jest.fn(() =>
  Promise.resolve({ data: { path: 'mock/path.jpg' }, error: null })
);
const mockStorageGetPublicUrl = jest.fn(() => ({
  data: { publicUrl: 'http://mock.url/mock/path.jpg' },
}));
const mockStorageRemove = jest.fn(() => Promise.resolve({ error: null }));

// Mock Supabase
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(() => Promise.resolve({})),
    },
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
   storage: {
      from: jest.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      })),
    })),
    removeChannel: jest.fn(),
  },
}));
