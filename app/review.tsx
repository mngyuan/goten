import {useFocusEffect} from '@react-navigation/native';
import {useRouter} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedChatLoading from '../components/AnimatedChatLoading';
import {useModel} from '../providers/ModelProvider';
import {getDiaryDay, getTodayISO} from '../utils/diary';
import {buildSystemPrompt} from '../utils/systemPrompt';

type ReviewMode = 'review' | 'suggest' | 'grammar';

const MODE_COLORS: Record<ReviewMode, string> = {
  review: '#007AFF',
  suggest: '#FF6B6B',
  grammar: '#34C759',
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ReviewScreen() {
  const router = useRouter();
  const llm = useModel();

  const [mode, setMode] = useState<ReviewMode>('review');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [diaryEntries, setDiaryEntries] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Load diary entries on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const today = await getDiaryDay(getTodayISO());
        if (today) {
          const filled = today.entries.filter((e) => e.trim().length > 0);
          setDiaryEntries(filled);
        }
      })();
    }, []),
  );

  // Start conversation once diary entries are loaded
  useEffect(() => {
    if (diaryEntries.length === 0 || initialized) return;

    const diaryMessage = diaryEntries
      .map((e, i) => `${i + 1}. ${e}`)
      .join('\n');

    setMessages([{role: 'user', content: diaryMessage}]);

    // Configure system prompt and send initial message
    const systemPrompt = buildSystemPrompt(diaryEntries);
    llm.configure({chatConfig: {systemPrompt}});

    // Send diary entries to model for review
    const reviewPrompt = `Please review my diary entries for today:\n${diaryMessage}`;
    llm.sendMessage(reviewPrompt).catch(console.error);

    setInitialized(true);
  }, [diaryEntries, initialized, llm]);

  // Capture completed assistant responses
  useEffect(() => {
    if (!llm.isGenerating && llm.response && initialized) {
      setMessages((prev) => [
        ...prev,
        {role: 'assistant', content: llm.response.trim()},
      ]);
    }
  }, [llm.isGenerating, llm.response, initialized]);

  const sendMessage = async () => {
    if (!userInput.trim() || llm.isGenerating) return;
    const text = userInput.trim();
    setUserInput('');
    textInputRef.current?.clear();
    Keyboard.dismiss();

    setMessages((prev) => [...prev, {role: 'user', content: text}]);

    try {
      await llm.sendMessage(text);
    } catch (e) {
      console.error(e);
    }
  };

  const bubbleColor = MODE_COLORS[mode];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity onPress={() => setMode('review')}>
          <Text
            style={[
              styles.modeText,
              mode === 'review' && styles.modeTextActive,
            ]}
          >
            Review
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('suggest')}>
          <Text
            style={[
              styles.modeText,
              mode === 'suggest' && styles.modeTextActive,
              mode !== 'suggest' && styles.modeTextInactive,
            ]}
          >
            Suggest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('grammar')}>
          <Text
            style={[
              styles.modeText,
              mode === 'grammar' && styles.modeTextActive,
              mode !== 'grammar' && styles.modeTextInactive,
            ]}
          >
            Grammar Practice
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? styles.userBubble
                  : [styles.assistantBubble, {backgroundColor: bubbleColor}],
              ]}
            >
              <Text
                style={
                  msg.role === 'user'
                    ? styles.userBubbleText
                    : styles.assistantBubbleText
                }
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Generating indicator */}
          {llm.isGenerating && (
            <View style={styles.generatingRow}>
              <View style={styles.avatarDot} />
              {!llm.response ? (
                <View
                  style={[
                    styles.messageBubble,
                    styles.assistantBubble,
                    {backgroundColor: bubbleColor},
                    styles.loadingBubble,
                  ]}
                >
                  <AnimatedChatLoading />
                </View>
              ) : (
                <View
                  style={[
                    styles.messageBubble,
                    styles.assistantBubble,
                    {backgroundColor: bubbleColor},
                  ]}
                >
                  <Text style={styles.assistantBubbleText}>
                    {llm.response.trim()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{height: 16}} />
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputArea}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={userInput}
            onChangeText={setUserInput}
            placeholder=""
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!userInput.trim() || llm.isGenerating) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!userInput.trim() || llm.isGenerating}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#000',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 12,
  },
  modeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modeTextActive: {
    color: '#000',
  },
  modeTextInactive: {
    color: '#ccc',
    fontWeight: 'normal',
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#E8E8E8',
    alignSelf: 'flex-start',
  },
  assistantBubble: {
    alignSelf: 'flex-end',
  },
  userBubbleText: {
    fontSize: 16,
    color: '#000',
  },
  assistantBubbleText: {
    fontSize: 16,
    color: '#fff',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 8,
    marginBottom: 8,
  },
  loadingBubble: {
    width: 60,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
