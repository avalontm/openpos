import React from "react";
import { Box as InkBox, Text } from "ink";
import TextInput from "ink-text-input";
import { Box } from "./Box.js";
import { theme } from "../theme.js";

type InputVariant = "default" | "error" | "success" | "warning" | "disabled";

type InputType = "text" | "password" | "email" | "number" | "tel" | "rfc" | "currency";

type ValidationRule = {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  custom?: (value: string) => boolean;
  message: string;
};

type Props = {
  label?:       string;
  placeholder?: string;
  value:        string;
  onChange:     (value: string) => void;
  onSubmit?:    () => void;
  onTab?:       () => void;
  onBackspace?: () => void;
  onEscape?:    () => void;
  variant?:     InputVariant;
  disabled?:    boolean;
  width?:       number;
  type?:        InputType;
  mask?:        string;
  validation?:  ValidationRule[];
  errorMessage?: string;
  helperText?:  string;
  required?:    boolean;
  autoFocus?:   boolean;
  isFocused?:   boolean;
  debounce?:    number;
  maxLength?:   number;
  minLength?:   number;
};

const VARIANT_COLORS: Record<InputVariant, { border: string; label: string; focus: string }> = {
  default:  { border: theme.textMuted, label: theme.textSec, focus: theme.blue },
  error:    { border: theme.red,       label: theme.red,     focus: theme.red },
  success:  { border: theme.green,     label: theme.green,   focus: theme.green },
  warning:  { border: theme.amber,     label: theme.amber,   focus: theme.amber },
  disabled: { border: theme.textDim,   label: theme.textDim, focus: theme.textDim },
};

// Máscaras predefinidas
const applyMask = (value: string, mask: string): string => {
  if (!mask) return value;
  
  let result = "";
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i];
    if (maskChar === "9") {
      // Dígito
      if (/\d/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else if (maskChar === "A") {
      // Letra o número
      if (/[A-Za-z0-9]/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else if (maskChar === "L") {
      // Solo letra
      if (/[A-Za-z]/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else {
      // Caracter fijo
      result += maskChar;
      if (value[valueIndex] === maskChar) {
        valueIndex++;
      }
    }
  }
  
  return result;
};

// Formateadores por tipo
const formatByType = (value: string, type: InputType): string => {
  switch (type) {
    case "currency":
      const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
      if (isNaN(num)) return "";
      return `$${num.toFixed(2)}`;
    case "rfc":
      let rfc = value.toUpperCase();
      if (rfc.length > 12) rfc = rfc.slice(0, 12);
      if (rfc.length >= 10) {
        // RFC persona moral: 12 caracteres, persona física: 13
        if (rfc.length === 12) {
          return rfc.replace(/(.{3})(.{6})(.{3})/, "$1$2-$3");
        } else if (rfc.length === 13) {
          return rfc.replace(/(.{4})(.{6})(.{3})/, "$1$2-$3");
        }
      }
      return rfc;
    case "number":
      return value.replace(/[^0-9.-]/g, "");
    case "tel":
      return value.replace(/[^0-9+-]/g, "");
    default:
      return value;
  }
};

export function Input({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onSubmit,
  onTab,
  onBackspace,
  onEscape,
  variant = "default",
  disabled = false,
  width,
  type = "text",
  mask,
  validation = [],
  errorMessage: externalErrorMessage,
  helperText,
  required = false,
  autoFocus = false,
  isFocused: externalIsFocused,
  debounce = 0,
  maxLength,
  minLength,
}: Props) {
  const [internalIsFocused, setInternalIsFocused] = React.useState(autoFocus);
  const isFocused = externalIsFocused !== undefined ? externalIsFocused : internalIsFocused;
  const setIsFocused = externalIsFocused !== undefined ? () => {} : setInternalIsFocused;
  const [internalValue, setInternalValue] = React.useState(value);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const colors = VARIANT_COLORS[disabled ? "disabled" : variant];
  
  // Validar valor
  const validateValue = (val: string): string | null => {
    // Required validation
    if (required && !val.trim()) {
      return "Este campo es requerido";
    }
    
    // Min length
    if (minLength && val.length < minLength) {
      return `Mínimo ${minLength} caracteres`;
    }
    
    // Max length
    if (maxLength && val.length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    
    // Custom validations
    for (const rule of validation) {
      if (rule.pattern && !rule.pattern.test(val)) {
        return rule.message;
      }
      if (rule.minLength && val.length < rule.minLength) {
        return rule.message;
      }
      if (rule.maxLength && val.length > rule.maxLength) {
        return rule.message;
      }
      if (rule.custom && !rule.custom(val)) {
        return rule.message;
      }
    }
    
    return null;
  };
  
  // Manejar cambio con debounce y formatos
  const handleChange = (newValue: string) => {
    if (disabled) return;
    
    let processedValue = newValue;
    
    // Aplicar longitud máxima
    if (maxLength && processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }
    
    // Aplicar máscara
    if (mask) {
      processedValue = applyMask(processedValue, mask);
    }
    
    // Aplicar formato por tipo
    processedValue = formatByType(processedValue, type);
    
    // Para password, no aplicar formatos especiales
    if (type === "password") {
      processedValue = newValue;
    }
    
    setInternalValue(processedValue);
    
    // Validar en tiempo real
    const error = validateValue(processedValue);
    setInternalError(error);
    
    // Debounce para onChange
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (debounce > 0) {
      debounceTimerRef.current = setTimeout(() => {
        onChange(processedValue);
      }, debounce);
    } else {
      onChange(processedValue);
    }
  };
  
  const isPassword = type === "password";
  const displayValue = isPassword ? "•".repeat(internalValue.length) : internalValue;
  
  const handlePasswordChange = (val: string) => {
    if (isPassword) {
      const diff = val.length - internalValue.length;
      if (diff > 0) {
        const newChars = val.slice(-diff);
        if (/^\d+$/.test(newChars)) {
          handleChange(internalValue + newChars);
        }
      } else if (diff < 0) {
        handleChange(internalValue.slice(0, diff));
      }
    } else {
      handleChange(val);
    }
  };
  
  // Mensaje de error final
  const finalErrorMessage = externalErrorMessage || internalError;
  const hasError = !!finalErrorMessage;
  const currentVariant = hasError ? "error" : variant;
  const currentColors = VARIANT_COLORS[disabled ? "disabled" : currentVariant];
  
  return (
    <Box flexDirection="column" width={width}>
      {/* Label */}
      {label && (
        <Box gap={0}>
          <Text color={currentColors.label} bold={isFocused}>
            {type === "password" ? `🔒 ${label}` : label}
          </Text>
          {required && (
            <Text color={theme.red}>*</Text>
          )}
        </Box>
      )}
      
      {/* Input field */}
      <InkBox 
        height={3}
        borderStyle="single" 
        borderColor={isFocused && !disabled ? currentColors.focus : currentColors.border}
        backgroundColor={disabled ? theme.bgSection : theme.bgInput}
      >
        <TextInput
          value={displayValue}
          onChange={handlePasswordChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          focus={isFocused}
          showCursor={isFocused}
        />
      </InkBox>
      
      {/* Helper text */}
      {helperText && !hasError && (
        <Box marginTop={0}>
          <Text color={theme.textMuted} size="small">
            {helperText}
          </Text>
        </Box>
      )}
      
      {/* Error message */}
      {hasError && (
        <Box marginTop={0}>
          <Text color={theme.red} size="small">
            ✗ {finalErrorMessage}
          </Text>
        </Box>
      )}
      
      {/* Character counter */}
      {maxLength && (
        <Box justifyContent="flex-end" marginTop={0}>
          <Text color={internalValue.length > maxLength * 0.9 ? theme.amber : theme.textMuted} size="small">
            {internalValue.length}/{maxLength}
          </Text>
        </Box>
      )}
    </Box>
  );
}