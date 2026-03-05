import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

export default function MainLayout() {
  const { colorScheme } = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
        <Stack.Screen name="new-transaction" />
      </Stack>
    </ThemeProvider>
  );
}
