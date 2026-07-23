import { StyleSheet } from 'react-native';

export const inputFieldStyles = StyleSheet.create({
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  fieldError: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
});
