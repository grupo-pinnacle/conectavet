import { Component } from 'react';
import { Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name="alert-circle" size={36} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>Ocurrió un error inesperado</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, maxWidth: 280, lineHeight: 20 }}>
            Algo salió mal. Tocá el botón para reintentar.
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={{ backgroundColor: '#0F766E', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}