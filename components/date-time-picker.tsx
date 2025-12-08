import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
}

const { width } = Dimensions.get('window');

export default function DateTimePicker({ value, onChange, mode = 'datetime' }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value);

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 1; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };

  const years = generateYears();
  const months = generateMonths();
  // Recalculate days when year or month changes
  const days = useMemo(() => {
    return generateDays(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);
  const hours = generateHours();
  const minutes = generateMinutes();

  const handleDateChange = (type: 'year' | 'month' | 'day' | 'hour' | 'minute', value: number) => {
    const newDate = new Date(selectedDate);
    
    if (type === 'year') {
      newDate.setFullYear(value);
      // Adjust day if needed (e.g., Feb 29 -> Feb 28 in non-leap year)
      const maxDay = new Date(value, newDate.getMonth() + 1, 0).getDate();
      if (newDate.getDate() > maxDay) {
        newDate.setDate(maxDay);
      }
    } else if (type === 'month') {
      newDate.setMonth(value - 1);
      // Adjust day if needed (e.g., Jan 31 -> Feb 28/29)
      const maxDay = new Date(newDate.getFullYear(), value, 0).getDate();
      if (newDate.getDate() > maxDay) {
        newDate.setDate(maxDay);
      }
    } else if (type === 'day') {
      newDate.setDate(value);
    } else if (type === 'hour') {
      newDate.setHours(value);
    } else if (type === 'minute') {
      newDate.setMinutes(value);
    }
    
    setSelectedDate(newDate);
    onChange(newDate);
  };

  const renderPickerColumn = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    formatter?: (value: number) => string,
    isYear?: boolean
  ) => {
    const itemHeight = 40;
    const scrollViewRef = useRef<ScrollView>(null);
    
    useEffect(() => {
      const selectedIndex = items.indexOf(selectedValue);
      if (selectedIndex >= 0 && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedIndex * itemHeight,
            animated: true,
          });
        }, 100);
      }
    }, [selectedValue, items, itemHeight]);

    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          contentContainerStyle={styles.pickerContent}
          onMomentumScrollEnd={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / itemHeight);
            const value = items[Math.max(0, Math.min(index, items.length - 1))];
            if (value !== selectedValue) {
              onValueChange(value);
            }
          }}
          scrollEventThrottle={16}
        >
          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                onPress={() => {
                  scrollViewRef.current?.scrollTo({
                    y: index * itemHeight,
                    animated: true,
                  });
                  onValueChange(item);
                }}
              >
                <Text style={[
                  isYear 
                    ? (isSelected ? styles.pickerItemTextYearSelected : styles.pickerItemTextYear)
                    : (isSelected ? styles.pickerItemTextSelected : styles.pickerItemText)
                ]}>
                  {formatter ? formatter(item) : item.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.pickerIndicator} />
      </View>
    );
  };

  if (mode === 'date') {
    return (
      <View style={styles.container}>
        {renderPickerColumn(
          years,
          selectedDate.getFullYear(),
          (value) => handleDateChange('year', value),
          (value) => value.toString(),
          true
        )}
        {renderPickerColumn(
          months,
          selectedDate.getMonth() + 1,
          (value) => handleDateChange('month', value),
          (value) => value.toString().padStart(2, '0')
        )}
        {renderPickerColumn(
          days,
          selectedDate.getDate(),
          (value) => handleDateChange('day', value),
          (value) => value.toString().padStart(2, '0')
        )}
      </View>
    );
  }

  if (mode === 'time') {
    return (
      <View style={styles.container}>
        {renderPickerColumn(
          hours,
          selectedDate.getHours(),
          (value) => handleDateChange('hour', value)
        )}
        <Text style={styles.separator}>:</Text>
        {renderPickerColumn(
          minutes,
          selectedDate.getMinutes(),
          (value) => handleDateChange('minute', value)
        )}
      </View>
    );
  }

  // datetime mode
  return (
    <View style={styles.container}>
      <View style={styles.dateSection}>
        {renderPickerColumn(
          years,
          selectedDate.getFullYear(),
          (value) => handleDateChange('year', value),
          (value) => value.toString(),
          true
        )}
        {renderPickerColumn(
          months,
          selectedDate.getMonth() + 1,
          (value) => handleDateChange('month', value),
          (value) => value.toString().padStart(2, '0')
        )}
        {renderPickerColumn(
          days,
          selectedDate.getDate(),
          (value) => handleDateChange('day', value),
          (value) => value.toString().padStart(2, '0')
        )}
      </View>
      <View style={styles.timeSection}>
        {renderPickerColumn(
          hours,
          selectedDate.getHours(),
          (value) => handleDateChange('hour', value)
        )}
        <Text style={styles.separator}>:</Text>
        {renderPickerColumn(
          minutes,
          selectedDate.getMinutes(),
          (value) => handleDateChange('minute', value)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  pickerColumn: {
    flex: 1,
    height: 160,
    position: 'relative',
  },
  pickerContent: {
    paddingVertical: 60,
    paddingHorizontal: 4,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'transparent',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#999',
  },
  pickerItemTextSelected: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  pickerItemTextYear: {
    fontSize: 14,
    color: '#999',
  },
  pickerItemTextYearSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  pickerIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  separator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 8,
  },
});

