import React from "react";
import { Pressable, Text, View } from "react-native";
import { captureException } from "../../services/monitoring.service";

type GlobalErrorBoundaryProps = {
  children: React.ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
};

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  public constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-red-500 font-bold text-xl mb-3 text-center">Algo salio mal</Text>
        <Text className="text-gray-300 text-center mb-6">
          Ocurrio un error inesperado en la app. Reinicia para continuar.
        </Text>
        <Pressable
          onPress={() => this.setState({ hasError: false })}
          className="h-11 rounded-xl bg-primary px-5 items-center justify-center"
        >
          <Text className="text-background font-semibold">Intentar recuperar</Text>
        </Pressable>
      </View>
    );
  }
}
