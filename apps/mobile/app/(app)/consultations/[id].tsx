import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useRef, useEffect } from "react";

const mockMessages = [
  { id: "1", sender: "vet", content: "Hola, vi que Max tiene un problema. ¿Qué notaste?", time: "14:30" },
  { id: "2", sender: "client", content: "Hola doctor, está comiendo menos desde ayer y vomitó dos veces.", time: "14:31" },
  { id: "3", sender: "vet", content: "Entiendo. ¿Tiene acceso a comida nueva o algo fuera de lo común?", time: "14:32" },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: "client", content: input, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View className="flex-row items-center p-4 bg-white border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-brand text-2xl">‹</Text>
        </Pressable>
        <View className="w-10 h-10 rounded-full bg-brand-soft items-center justify-center mr-3">
          <Text className="text-xl">🐾</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink">Max</Text>
          <Text className="text-xs text-green-600">En línea</Text>
        </View>
        <Pressable className="bg-brand w-10 h-10 rounded-full items-center justify-center">
          <Text className="text-white">📹</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {messages.map((msg) => {
          const isOwn = msg.sender === "client";
          return (
            <View
              key={msg.id}
              className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}
            >
              <View
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-brand rounded-br-md"
                    : "bg-surface text-ink rounded-bl-md"
                }`}
              >
                <Text className={isOwn ? "text-white" : "text-ink"}>{msg.content}</Text>
              </View>
              <Text className="text-xs text-ink-soft/70 mt-1 px-1">{msg.time}</Text>
            </View>
          );
        })}
      </ScrollView>

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
          onPress={send}
          disabled={!input.trim()}
          className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${
            input.trim() ? "bg-brand" : "bg-surface"
          }`}
        >
          <Text className={input.trim() ? "text-white" : "text-ink-soft"}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}