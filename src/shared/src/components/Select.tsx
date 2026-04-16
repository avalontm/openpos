import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";
import { Input } from "./Input.js";

type Option = { 
  label: string; 
  value: string;
  icon?: string;           // Nuevo
  disabled?: boolean;      // Nuevo
  group?: string;          // Nuevo: grupo
};

type SelectVariant = "default" | "compact" | "large";

type Props = {
  label?:     string;
  options:    Option[];
  selected?:  string | string[];  // Nuevo: soporte múltiple
  onChange:   (value: string | string[]) => void;
  active?:    boolean;
  multiple?:  boolean;              // Nuevo: selección múltiple
  searchable?: boolean;             // Nuevo: búsqueda
  placeholder?: string;             // Nuevo
  maxHeight?: number;               // Nuevo
  variant?: SelectVariant;          // Nuevo
  clearable?: boolean;              // Nuevo: botón limpiar
  onClear?: () => void;             // Nuevo
};

export function Select({ 
  label, 
  options, 
  selected, 
  onChange, 
  active = false,
  multiple = false,
  searchable = false,
  placeholder = "Selecciona una opción",
  maxHeight = 10,
  variant = "default",
  clearable = false,
  onClear,
}: Props) {
  const [cursor, setCursor] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  
  // Normalizar selected a array para múltiple
  const selectedArray = multiple 
    ? (Array.isArray(selected) ? selected : [])
    : (selected ? [selected as string] : []);
  
  // Filtrar opciones por búsqueda
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(term) || 
      opt.value.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);
  
  // Agrupar opciones
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, Option[]> = {};
    const ungrouped: Option[] = [];
    
    for (const opt of filteredOptions) {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    }
    
    return { groups, ungrouped };
  }, [filteredOptions]);
  
  // Asegurar cursor dentro de límites
  React.useEffect(() => {
    if (cursor >= filteredOptions.length && filteredOptions.length > 0) {
      setCursor(Math.max(0, filteredOptions.length - 1));
    }
  }, [filteredOptions.length]);
  
  // Manejar teclado
  useInput((input, key) => {
    if (!active) return;
    
    // Modo búsqueda
    if (searchable && !isSearching && (input.match(/[a-zA-Z0-9]/) || key.delete)) {
      setIsSearching(true);
      return;
    }
    
    if (isSearching) {
      if (key.return || key.escape) {
        setIsSearching(false);
        setSearchTerm("");
      }
      return;
    }
    
    // Navegación
    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor(c => Math.min(filteredOptions.length - 1, c + 1));
    } else if (key.pageUp) {
      setCursor(c => Math.max(0, c - 5));
    } else if (key.pageDown) {
      setCursor(c => Math.min(filteredOptions.length - 1, c + 5));
    } else if (key.home) {
      setCursor(0);
    } else if (key.end) {
      setCursor(filteredOptions.length - 1);
    }
    
    // Seleccionar
    if (key.return && filteredOptions[cursor] && !filteredOptions[cursor]!.disabled) {
      const selectedValue = filteredOptions[cursor]!.value;
      
      if (multiple) {
        const newSelection = selectedArray.includes(selectedValue)
          ? selectedArray.filter(v => v !== selectedValue)
          : [...selectedArray, selectedValue];
        onChange(newSelection);
      } else {
        onChange(selectedValue);
      }
    }
    
    // Limpiar
    if (clearable && key.delete && key.ctrl) {
      if (multiple) {
        onChange([]);
      } else {
        onChange("");
      }
      onClear?.();
    }
    
    // Seleccionar todos (solo múltiple)
    if (multiple && key.ctrl && input === "a") {
      onChange(filteredOptions.filter(o => !o.disabled).map(o => o.value));
    }
  });
  
  const variantStyles = {
    default: { paddingX: 1, gap: 1 },
    compact: { paddingX: 0, gap: 0 },
    large:   { paddingX: 2, gap: 2 },
  };
  
  const styles = variantStyles[variant];
  
  // Mostrar resumen de selección múltiple
  const getSelectionSummary = (): string => {
    if (!multiple) return "";
    if (selectedArray.length === 0) return "Ninguno seleccionado";
    if (selectedArray.length === 1) {
      const opt = options.find(o => o.value === selectedArray[0]);
      return opt?.label || selectedArray[0];
    }
    return `${selectedArray.length} seleccionados`;
  };
  
  return (
    <Box flexDirection="column" width="100%">
      {/* Label y resumen */}
      {(label || (multiple && selectedArray.length > 0)) && (
        <Box justifyContent="space-between">
          {label && (
            <Text color={theme.textSec} bold>
              {label}
            </Text>
          )}
          {multiple && selectedArray.length > 0 && (
            <Text color={theme.green} size="small">
              {getSelectionSummary()}
            </Text>
          )}
        </Box>
      )}
      
      {/* Input de búsqueda */}
      {searchable && isSearching && (
        <Box marginBottom={1}>
          <Input
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar..."
            autoFocus
            width={40}
          />
        </Box>
      )}
      
      {/* Indicador de búsqueda */}
      {searchable && !isSearching && active && (
        <Text color={theme.textMuted} size="small" dimColor>
          Presiona cualquier tecla para buscar...
        </Text>
      )}
      
      {/* Lista de opciones */}
      <Box 
        flexDirection="column" 
        maxHeight={maxHeight}
        overflowY="auto"
        paddingX={styles.paddingX}
        gap={styles.gap}
      >
        {filteredOptions.length === 0 && (
          <Text color={theme.textMuted} dimColor>
            No hay opciones disponibles
          </Text>
        )}
        
        {/* Renderizar grupos */}
        {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => (
          <Box key={groupName} flexDirection="column" marginTop={1}>
            <Text color={theme.textMuted} bold>
              {groupName}
            </Text>
            {groupOptions.map((opt, idx) => {
              const absoluteIndex = filteredOptions.findIndex(o => o.value === opt.value);
              const isCursor = absoluteIndex === cursor && active;
              const isSelected = selectedArray.includes(opt.value);
              
              return (
                <Box key={opt.value} flexDirection="row" gap={1} marginLeft={1}>
                  <Text color={isCursor ? theme.green : theme.textMuted}>
                    {isCursor ? "›" : " "}
                  </Text>
                  {multiple && (
                    <Text color={isSelected ? theme.green : theme.textMuted}>
                      {isSelected ? "☑" : "☐"}
                    </Text>
                  )}
                  {opt.icon && (
                    <Text color={theme.textMuted}>{opt.icon}</Text>
                  )}
                  <Text 
                    color={
                      opt.disabled ? theme.textDim :
                      isSelected ? theme.green : 
                      isCursor ? theme.white : theme.textSec
                    }
                    bold={isSelected}
                    dimColor={opt.disabled}
                  >
                    {opt.label}
                  </Text>
                  {opt.disabled && (
                    <Text color={theme.textDim} size="small">(deshabilitado)</Text>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
        
        {/* Opciones sin grupo */}
        {groupedOptions.ungrouped.map((opt, idx) => {
          const absoluteIndex = filteredOptions.findIndex(o => o.value === opt.value);
          const isCursor = absoluteIndex === cursor && active;
          const isSelected = selectedArray.includes(opt.value);
          
          return (
            <Box key={opt.value} flexDirection="row" gap={1}>
              <Text color={isCursor ? theme.green : theme.textMuted}>
                {isCursor ? "›" : " "}
              </Text>
              {multiple && (
                <Text color={isSelected ? theme.green : theme.textMuted}>
                  {isSelected ? "☑" : "☐"}
                </Text>
              )}
              {opt.icon && (
                <Text color={theme.textMuted}>{opt.icon}</Text>
              )}
              <Text 
                color={
                  opt.disabled ? theme.textDim :
                  isSelected ? theme.green : 
                  isCursor ? theme.white : theme.textSec
                }
                bold={isSelected}
                dimColor={opt.disabled}
              >
                {opt.label}
              </Text>
              {opt.disabled && (
                <Text color={theme.textDim} size="small">(deshabilitado)</Text>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* Atajos de teclado */}
      {active && (
        <Box gap={2} marginTop={1}>
          <Text color={theme.textMuted} size="small">
            ↑↓ navegar
          </Text>
          <Text color={theme.textMuted} size="small">
            Enter seleccionar
          </Text>
          {clearable && (
            <Text color={theme.textMuted} size="small">
              Ctrl+Del limpiar
            </Text>
          )}
          {multiple && (
            <Text color={theme.textMuted} size="small">
              Ctrl+A todos
            </Text>
          )}
          {searchable && (
            <Text color={theme.textMuted} size="small">
              Esc salir búsqueda
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}