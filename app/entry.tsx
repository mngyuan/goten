import {Stack} from 'expo-router';
import React from 'react';

const Entry = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="diary" />
      <Stack.Screen name="review" />
    </Stack>
  );
};

export default Entry;
