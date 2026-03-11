import {useHeaderHeight} from '@react-navigation/elements';
import {useFocusEffect} from '@react-navigation/native';
import {useRouter} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AnimatedChatLoading from '@/components/AnimatedChatLoading';
import Spinner from '@/components/Spinner';
import {useModel} from '@/providers/ModelProvider';
import {getDiaryDay, getTodayISO} from '@/utils/diary';
import {buildSystemPrompt} from '@/utils/systemPrompt';

const SHOW_THINKING = true;

function parseThinking(response: string): {
  isThinking: boolean;
  content: string;
} {
  const hasThinkOpen = response.includes('<think>');
  const hasThinkClose = response.includes('</think>');

  if (!hasThinkOpen) {
    return {isThinking: false, content: response};
  }

  if (hasThinkOpen && !hasThinkClose) {
    return {isThinking: true, content: ''};
  }

  const content = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  return {isThinking: false, content};
}

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

const LLMChatArea = ({
  diaryEntries,
  mode,
}: {
  diaryEntries: string[];
  mode: ReviewMode;
}) => {
  const height = useHeaderHeight();
  const scrollViewRef = useRef<ScrollView>(null);

  const llm = useModel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const textInputRef = useRef<TextInput>(null);

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
      const finalContent = SHOW_THINKING
        ? llm.response.trim()
        : parseThinking(llm.response).content;
      if (finalContent) {
        setMessages((prev) => [
          ...prev,
          {role: 'assistant', content: finalContent},
        ]);
      }
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
  const {isThinking, content: streamingContent} =
    SHOW_THINKING || !llm.response
      ? {isThinking: false, content: llm.response?.trim() ?? ''}
      : parseThinking(llm.response);
  const showThinkingSpinner =
    llm.isGenerating && (isThinking || !streamingContent);

  if (!llm.isReady) {
    return (
      <Spinner
        visible={true}
        textContent={`Loading model ${(llm.downloadProgress * 100).toFixed(0)}%`}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.chatArea}
      keyboardVerticalOffset={height}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            ) : showThinkingSpinner ? (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  {backgroundColor: bubbleColor},
                  styles.thinkingBubble,
                ]}
              >
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.thinkingText}>Thinking...</Text>
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
                  {streamingContent}
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
  );
};

export default function ReviewScreen() {
  const router = useRouter();
  const [diaryEntries, setDiaryEntries] = useState<string[]>([]);

  const [mode, setMode] = useState<ReviewMode>('review');
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity onPress={() => setMode('review')}>
          <Text
            style={[
              styles.modeText,
              mode === 'review' && styles.modeTextActive,
              mode !== 'review' && styles.modeTextInactive,
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

      <LLMChatArea diaryEntries={diaryEntries} mode={mode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
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
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
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
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
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
