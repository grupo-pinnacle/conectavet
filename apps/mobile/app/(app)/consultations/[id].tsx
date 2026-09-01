import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/trpc/react";
import { Avatar } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const { data: consultation, isLoading: consLoading } = trpc.consultations.byId.useQuery(
    { id: id! },
    { enabled: !!id }
  );
  const { data: messages } = trpc.consultations.messages.useQuery(
    { id: id! },
    { enabled: !!id, refetchInterval: 4000 }
  );
  const sendMutation = trpc.consultations.sendMessage.useMutation({
    onSuccess: () => {
      utils.consultations.messages.invalidate({ id: id });
      setInput("");
    },
  });

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  if (consLoading || !consultation) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1C60F0" />
      </View>
    );
  }

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate({ consultationId: id!, content: input.trim() });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View className="flex-row items-center p-3 bg-white border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-brand text-2xl">‹</Text>
        </Pressable>
        <Avatar src={consultation.pet?.photoUrl} name={consultation.pet?.name} size="md" />
        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold text-ink">{consultation.pet?.name}</Text>
          <Text className="text-xs text-ink-soft">{consultation.pet?.species}</Text>
        </View>
        <Pressable className="bg-brand w-10 h-10 rounded-full items-center justify-center">
          <Text className="text-white">📹</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {messages?.map((m) => {
          // En el mobile no tenemos el userId del session actual;
          // mostramos como "isOwn" si el senderId no es el del pet/client
          const isOwn = m.senderId !== consultation.clientId;
          return (
            <View
              key={m.id}
              className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}
            >
              <View
                className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-white border border-border text-ink rounded-bl-md"
                }`}
              >
                {m.content && <Text className={isOwn ? "text-white" : "text-ink"}>{m.content}</Text>}
                {m.attachmentUrl && (
                  <Text className={isOwn ? "text-white text-sm underline" : "text-brand text-sm underline"}>
                    📎 {m.attachmentUrl.split("/").pop()}
                  </Text>
                )}
              </View>
              <Text className="text-[10px] text-ink-soft/70 mt-0.5 px-1">
                {formatRelativeTime(m.createdAt)}
              </Text>
            </View>
          );
        })}
        {(!messages || messages.length === 0) && (
          <View className="items-center py-12">
            <Text className="text-5xl mb-2">💬</Text>
            <Text className="text-ink-soft text-sm">Sin mensajes aún</Text>
          </View>
        )}
      </ScrollView>

      {consultation.status === "ACTIVE" ? (
        <View className="flex-row items-end p-3 bg-white border-t border-border">
          <Pressable className="w-10 h-10 items-center justify-center mr-2">
            <Text className="text-2xl text-ink-soft">📎</Text>
          </Pressable>
          <View className="flex-1">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Mensaje..."
              multiline
              className="bg-surface border border-border rounded-2xl px-4 py-2 text-ink max-h-[100px]"
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${
              input.trim() ? "bg-brand" : "bg-surface"
            }`}
          >
            <Text className={input.trim() ? "text-white" : "text-ink-soft"}>↑</Text>
          </Pressable>
        </View>
      ) : (
        <View className="p-3 bg-amber-50 border-t border-amber-200 items-center">
          <Text className="text-amber-800 text-sm">
            {consultation.status === "WAITING" ? "Esperando veterinario..." : "Consulta " + consultation.status.toLowerCase()}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}