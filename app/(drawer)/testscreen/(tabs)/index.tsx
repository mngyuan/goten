import {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDiary} from '@/providers/DiaryProvider';
import {importDiaryText} from '@/utils/diary';

export default function ImporterScreen() {
  const {refresh} = useDiary();
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    if (!importText.trim()) return;
    importDiaryText(importText);
    refresh();
    setImportText('');
    Alert.alert('Done', 'Diary entries imported.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import Nikki</Text>
        <TextInput
          style={styles.textArea}
          value={importText}
          onChangeText={setImportText}
          placeholder="Paste formatted diary text here..."
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.button, !importText.trim() && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={!importText.trim()}
        >
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 12,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    height: 320,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
