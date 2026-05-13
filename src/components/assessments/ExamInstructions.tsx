import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExamScreen from './ExamScreen';

interface Props {
  item: any;
  startLoading: boolean;
  onStartExam: () => void;
  onBack: () => void;
}

export default function ExamInstructions({
  item,
  startLoading,
  onStartExam,
  onBack,
}: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FC' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#EEE',
          backgroundColor: '#fff',
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 20 }}>←</Text>
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
        }}
      >
        {/* Card */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: '#ECECEC',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              ⚠ Assessment Instructions
            </Text>

            <Text
              style={{
                color: '#7C7C9A',
                fontSize: 12,
              }}
            >
              (Read before start)
            </Text>
          </View>

          {[
            'This is a live assessment. All students take the exam within the same time window.',
            'Your timer starts when you click "Start Assessment". You must finish within the exam duration.',
            'You must complete the exam before the assessment window closes.',
            'Marking scheme: +4 for correct, -1 for incorrect MCQ, 0 for unattended.',
            'You may switch between sections at any time during the exam.',
            'Answers are saved automatically when you click "Save & Next".',
            'Once you submit, the exam cannot be resumed.',
            'Switching tabs will be recorded and may be flagged.',
            'Results and rankings will be available after the assessment window closes.',
          ].map((text, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: '#4F46E5',
                  width: 20,
                  fontWeight: '700',
                }}
              >
                {index + 1}.
              </Text>

              <Text
                style={{
                  flex: 1,
                  color: '#555',
                  lineHeight: 22,
                }}
              >
                {text}
              </Text>
            </View>
          ))}
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => setAccepted(!accepted)}
          style={{
            flexDirection: 'row',
            marginTop: 24,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: '#6C5CE7',
              backgroundColor: accepted
                ? '#6C5CE7'
                : '#fff',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {accepted && (
              <Text style={{ color: '#fff' }}>
                ✓
              </Text>
            )}
          </View>

          <Text
            style={{
              flex: 1,
              marginLeft: 10,
              color: '#555',
              lineHeight: 20,
            }}
          >
            I have read and understood all the
            assessment instructions and I am
            ready to begin.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Button */}
      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#ECECEC',
          backgroundColor: '#fff',
        }}
      >
        <TouchableOpacity
          disabled={!accepted || startLoading}
          onPress={onStartExam}
          style={{
            backgroundColor: accepted
              ? '#5B3DF5'
              : '#D6D6E8',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          {startLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: '#fff',
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              Start Assessment
            </Text>
          )}
        </TouchableOpacity>

        {!accepted && (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 8,
              color: '#999',
              fontSize: 12,
            }}
          >
            Tick the checkbox above to
            enable the start button
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}