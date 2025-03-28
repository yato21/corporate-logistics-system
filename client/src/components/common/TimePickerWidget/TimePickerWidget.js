import React from 'react';
import dayjs from 'dayjs';
import './TimePickerWidget.css';

/**
 * Компонент виджета выбора времени с двумя колонками для часов и минут
 * @param {Object} props - Свойства компонента
 * @param {string} props.type - Тип селектора (start или end)
 * @param {number} props.selectedHour - Выбранный час
 * @param {number} props.selectedMinute - Выбранная минута
 * @param {function} props.onHourChange - Обработчик изменения часа
 * @param {function} props.onMinuteChange - Обработчик изменения минуты
 * @param {Array<number>} props.hours - Массив доступных часов
 * @param {Array<number>} props.minutes - Массив доступных минут
 * @param {Object} props.constraints - Ограничения для выбора времени
 * @param {number} props.constraints.minHour - Минимальный час (по умолчанию 8)
 * @param {number} props.constraints.maxHour - Максимальный час (по умолчанию 17)
 * @param {Array<number>} props.constraints.allowedMinutes - Разрешенные минуты (по умолчанию [0, 10, 20, 30, 40, 50])
 * @param {Date|string} props.constraints.minDateTime - Минимальная дата и время
 * @param {Date|string} props.constraints.maxDateTime - Максимальная дата и время
 * @param {function} props.constraints.shouldDisableDate - Функция для определения недоступных дат
 * @param {dayjs.Dayjs} props.referenceTime - Время, относительно которого применяются ограничения (для end-time)
 * @param {dayjs.Dayjs} props.selectedDate - Выбранная дата (используется для проверки ограничений)
 */
const TimePickerWidget = ({
  type = 'start',
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
  hours,
  minutes,
  constraints = {},
  referenceTime = null,
  selectedDate = null
}) => {
  // Получаем значения ограничений с дефолтными значениями
  const {
    minHour = 8,
    maxHour = 17,
    allowedMinutes = [0, 10, 20, 30, 40, 50],
    minDateTime = null,
    maxDateTime = null
  } = constraints;

  // Изменяем логику создания массива часов для начального времени
  const availableHours = hours || Array.from(
    { length: (type === 'start' ? maxHour - minHour : maxHour - minHour + 1) }, 
    (_, i) => i + minHour
  );

  // Если минуты не переданы, используем массив из allowedMinutes
  const availableMinutes = minutes || allowedMinutes;

  // Проверяем доступность часа
  const isHourDisabled = (hour) => {
    // Базовая проверка на рабочие часы
    if (hour < minHour || hour > maxHour) return true;

    // Проверяем текущее время для начального времени
    if (type === 'start') {
      const now = dayjs();
      const selectedDay = selectedDate.startOf('day');
      const today = now.startOf('day');

      if (selectedDay.isSame(today)) {
        // Если выбран текущий день, проверяем часы
        if (hour < now.hour()) return true;
        if (hour === now.hour()) {
          // Проверяем есть ли минуты, которые на 10 минут больше текущей
          const hasValidMinutes = allowedMinutes.some(
            minute => minute > now.minute() + 10
          );
          if (!hasValidMinutes) return true;
        }
      }
    }

    // Для времени окончания
    if (type === 'end') {
      if (referenceTime) {
        if (hour < referenceTime.hour()) return true;
        if (hour === referenceTime.hour()) {
          const hasValidMinutes = allowedMinutes.some(
            minute => minute > referenceTime.minute() + 10
          );
          if (!hasValidMinutes) return true;
        }
      }
    }

    return false;
  };

  // Проверяем доступность минуты
  const isMinuteDisabled = (minute) => {
    // Базовая проверка на допустимые минуты
    if (!allowedMinutes.includes(minute)) return true;

    // Проверка для начального времени
    if (type === 'start') {
      const now = dayjs();
      const selectedDay = selectedDate.startOf('day');
      const today = now.startOf('day');

      if (selectedDay.isSame(today) && selectedHour === now.hour()) {
        return minute <= now.minute() + 10;
      }
    }

    // Для времени окончания
    if (type === 'end') {
      if (referenceTime) {
        if (selectedHour === referenceTime.hour()) {
          return minute <= referenceTime.minute() + 10;
        }
      }

      if (selectedHour === 17) {
        return minute > 0;
      }
    }

    return false;
  };

  const hoursContentClassName = `${type}-hours-content`;
  const minutesContentClassName = `${type}-minutes-content`;

  const scrollUp = (contentClassName) => {
    const content = document.querySelector(`.${contentClassName}`);
    if (content) content.scrollTop -= 48;
  };

  const scrollDown = (contentClassName) => {
    const content = document.querySelector(`.${contentClassName}`);
    if (content) content.scrollTop += 48;
  };

  return (
    <div className="time-picker-columns">
      <div className="time-column">
        <div className="time-column-header">
          <button 
            className="scroll-button up"
            onClick={() => scrollUp(hoursContentClassName)}
          >
            <i className="fas fa-chevron-up"></i>
          </button>
          <span>Часы</span>
        </div>
        <div className={`time-column-content ${hoursContentClassName}`}>
          {availableHours.map((hour) => (
            <button
              key={hour}
              onClick={() => onHourChange(hour)}
              className={selectedHour === hour ? 'selected' : ''}
              disabled={isHourDisabled(hour)}
            >
              {hour.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="time-column-footer">
          <button 
            className="scroll-button down"
            onClick={() => scrollDown(hoursContentClassName)}
          >
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
      <div className="time-column">
        <div className="time-column-header">
          <button 
            className="scroll-button up"
            onClick={() => scrollUp(minutesContentClassName)}
          >
            <i className="fas fa-chevron-up"></i>
          </button>
          <span>Минуты</span>
        </div>
        <div className={`time-column-content ${minutesContentClassName}`}>
          {availableMinutes.map((minute) => (
            <button
              key={minute}
              onClick={() => onMinuteChange(minute)}
              className={selectedMinute === minute ? 'selected' : ''}
              disabled={isMinuteDisabled(minute)}
            >
              {minute.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="time-column-footer">
          <button 
            className="scroll-button down"
            onClick={() => scrollDown(minutesContentClassName)}
          >
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Константы для ограничений
 */
export const TIME_CONSTRAINTS = {
  BUSINESS_HOURS: {
    minHour: 8,
    maxHour: 17,
    allowedMinutes: [0, 10, 20, 30, 40, 50]
  },
  /* Удаляем массив праздничных дней
  HOLIDAYS_2024: [
    '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-08',
    '2024-02-23', '2024-03-08', '2024-05-01', '2024-05-09', '2024-06-12', '2024-11-04'
  ],
  */
  // Изменяем метод, добавляя проверку на прошедшие даты
  shouldDisableBusinessDate: (date) => {
    // Проверяем прошедшие даты (дата раньше сегодняшнего дня)
    const today = dayjs().startOf('day');
    const isPastDate = date.isBefore(today);
    
    // Проверяем на выходные
    const isWeekend = date.day() === 0 || date.day() === 6;

    // Проверяем наличие доступных часов для этой даты
    const hasAvailableHours = (() => {
      const now = dayjs();
      const isToday = date.isSame(today);
      
      // Проходимся по всем рабочим часам
      for (let hour = 8; hour < 17; hour++) {
        // Для текущего дня проверяем, есть ли доступные минуты в часе
        if (isToday) {
          if (hour < now.hour()) continue;
          if (hour === now.hour()) {
            // Проверяем есть ли минуты, которые на 10 минут больше текущей
            const hasValidMinutes = [0, 10, 20, 30, 40, 50].some(
              minute => minute > now.minute() + 10
            );
            if (hasValidMinutes) return true;
          } else {
            return true; // Будущие часы сегодня доступны
          }
        } else {
          return true; // Для будущих дней все рабочие часы доступны
        }
      }
      return false; // Нет доступных часов
    })();

    return isPastDate || isWeekend || !hasAvailableHours;
  }
};

export default TimePickerWidget; 