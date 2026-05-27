import {ScrollView, StyleSheet} from 'react-native';

const SettingsPage = () => {
  return <ScrollView contentContainerStyle={styles.container} />;
};

export default SettingsPage;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
});
