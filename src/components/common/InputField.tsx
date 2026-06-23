import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inputFieldStyles as styles } from '@/src/styles/styles/common/inputfieldstyles';

type IoniconName = keyof typeof Ionicons.glyphMap;

// Generic, reusable text input used across auth (signin/signup) and any other
// form. It renders the label + required star, an optional leading icon, the
// field itself, and either an error or a hint below. Pass through any standard
// TextInput prop (value, onChangeText, keyboardType, autoCapitalize, etc.).
interface InputFieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  // Leading Ionicons name, e.g. "mail-outline", "lock-closed-outline".
  icon?: IoniconName;
  // When set, shows the message in red and outlines the field.
  error?: string;
  // Helper text shown below the field when there's no error.
  hint?: string;
  // Adds a show/hide toggle for password fields (forces secureTextEntry).
  password?: boolean;
  containerStyle?: ViewStyle;
}

const InputField = ({
  label,
  required = false,
  icon,
  error,
  hint,
  password = false,
  containerStyle,
  style,
  secureTextEntry,
  placeholderTextColor = '#9CA3AF',
  ...rest
}: InputFieldProps) => {
  const [hidden, setHidden] = useState(true);

  // A password field starts hidden and is toggled via the eye icon; otherwise
  // honor the caller's secureTextEntry.
  const isSecure = password ? hidden : secureTextEntry;

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {!!label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      )}

      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        {!!icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#94A3B8"
            style={styles.inputIcon}
          />
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={isSecure}
          {...rest}
        />

        {password && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.inputHint}>{hint}</Text>
      ) : null}
    </View>
  );
};

export default InputField;
