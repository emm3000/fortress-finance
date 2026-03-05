import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Auth flows often look better with fade transitions
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </ThemeProvider>
  );
}
