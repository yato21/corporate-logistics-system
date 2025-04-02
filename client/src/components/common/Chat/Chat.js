import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatMessages, sendChatMessage, setActiveChatUI, selectChatMessages, markMessagesAsRead } from '../../../redux/slices/chatSlice';
import dayjs from 'dayjs';
import './Chat.css';
import socketService from '../../../services/socket';

const Chat = ({ orderId, onClose, isInModal = false }) => {
  const dispatch = useDispatch();
  const chatMessages = useSelector(state => selectChatMessages(state, orderId));
  const { user } = useSelector(state => state.auth);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Загрузка истории сообщений при открытии чата
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        setError(null);
        await dispatch(fetchChatMessages(orderId)).unwrap();
        
        // После загрузки сообщений, отмечаем их как прочитанные
        await dispatch(markMessagesAsRead(orderId)).unwrap();
      } catch (err) {
        console.error('Не удалось загрузить сообщения:', err);
        setError('Не удалось загрузить историю сообщений');
      } finally {
        setLoadingMessages(false);
      }
    };
    
    loadMessages();
    
    // Подписка на Socket.IO канал
    if (socketService.socket?.connected) {
      console.log(`Подписка на чат заказа ${orderId}`);
      socketService.emit('joinOrderChat', orderId);
    } else {
      console.warn('Socket.IO не подключен при попытке подписаться на чат');
    }
    
    // Добавить обработчики переподключения
    if (socketService.socket) {
      socketService.socket.on('reconnect', () => {
        console.log('Соединение восстановлено, переподключаемся к чату');
        socketService.emit('joinOrderChat', orderId);
      });
      
      socketService.socket.on('disconnect', () => {
        console.log('Соединение с сервером потеряно');
        // Можно показать пользователю индикатор отключения
      });
    }
    
    return () => {
      if (socketService.socket) {
        socketService.socket.off('reconnect');
        socketService.socket.off('disconnect');
      }
    };
  }, [dispatch, orderId]);

  // Улучшаем эффект для прокрутки чата
  useEffect(() => {
    // Функция для прокрутки чата вниз
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };

    // Выполняем прокрутку при загрузке сообщений
    if (!loadingMessages && chatMessages.length > 0) {
      // Используем setTimeout, чтобы дать время на полный рендер сообщений
      setTimeout(scrollToBottom, 100);
    }
    
    // Также прокручиваем при изменении chatMessages
    scrollToBottom();
    
    // И для дополнительной надежности используем MutationObserver
    if (chatContainerRef.current) {
      const observer = new MutationObserver(scrollToBottom);
      observer.observe(chatContainerRef.current, { 
        childList: true, 
        subtree: true 
      });
      
      return () => observer.disconnect();
    }
  }, [chatMessages, loadingMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;
    
    try {
      setLoading(true);
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      if (message.trim()) {
        formData.append('message', message.trim());
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      await dispatch(sendChatMessage({ orderId, formData })).unwrap();
      setMessage('');
      setSelectedFile(null);
      
      // Сбрасываем значение input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      setError('Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Проверяем размер файла (не более 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        e.target.value = '';
        return;
      }
      
      // Проверяем тип файла
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Неподдерживаемый тип файла. Разрешены: PDF, Word, Excel и изображения');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const formatTime = useCallback((timestamp) => {
    return dayjs(timestamp).format('HH:mm');
  }, []);

  const handleFileClick = async (file) => {
    if (!file || !file.id) {
      console.error('Отсутствует ID файла');
      return;
    }

    try {
      // Устанавливаем индикатор загрузки
      setLoading(true);
      
      // Используем полный URL сервера
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // Создаем URL для скачивания с правильно закодированным путем
      const downloadUrl = `${serverUrl}/uploads/${encodeURIComponent(file.filePath)}`;
      
      console.log('Скачивание файла:', {
        url: downloadUrl,
        originalName: file.originalName
      });
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка при скачивании файла: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Декодируем имя файла, если оно было закодировано
      link.download = decodeURIComponent(escape(file.originalName)) || 'file';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      setError('Ошибка при скачивании файла: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция для определения иконки файла на основе его типа
  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'fa-file'; // Возвращаем общую иконку, если тип не определен
    
    if (mimeType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (mimeType.includes('word') || mimeType.includes('doc')) {
      return 'fa-file-word';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('xls')) {
      return 'fa-file-excel';
    } else if (mimeType.includes('image')) {
      return 'fa-file-image';
    } else {
      return 'fa-file';
    }
  };

  // Добавляем функцию проверки, является ли файл изображением
  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  // Функция для отображения сообщения с файлом
  const renderMessageFile = (file) => {
    // Если это изображение, отображаем его непосредственно в чате
    if (isImageFile(file.mimeType)) {
      const fileId = file.id || file.filePath;
      const imageKey = `img-${fileId}`;
      
      return (
        <div className="message-image">
          <img 
            src={`data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI0IDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjEyIiB5PSIxMiIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPtCX0LDQs9GA0YPQt9C60LA8L3RleHQ+PC9zdmc+`}
            alt={file.originalName || 'Изображение'}
            className="chat-image"
            data-file-id={fileId}
            id={imageKey}
            onClick={() => handleImageClick(file)}
            ref={el => {
              // Загружаем изображение только один раз при монтировании элемента
              if (el && !el.getAttribute('data-loaded')) {
                loadImageWithToken(file, el);
              }
            }}
          />
          <div className="image-caption">
            {decodeURIComponent(escape(file.originalName || 'Изображение'))}
          </div>
        </div>
      );
    }
    
    // Для других типов файлов оставляем прежнее поведение
    return (
      <div className="message-file" onClick={() => handleFileClick(file)}>
        <i className={`fas ${getFileIcon(file.mimeType)}`}></i>
        <span className="file-name">
          {decodeURIComponent(escape(file.originalName || 'Файл'))}
        </span>
        <i className="fas fa-download"></i>
      </div>
    );
  };

  // Обновляем функцию для загрузки изображения с токеном
  const loadImageWithToken = async (file, imgElement) => {
    try {
      // Проверяем, не загружен ли уже элемент
      if (imgElement.getAttribute('data-loaded') === 'true') {
        return;
      }
      
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // Используем новый путь для просмотра изображений
      const imageUrl = `${serverUrl}/uploads/view/${encodeURIComponent(file.filePath)}`;
      
      // Загружаем изображение с токеном
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке изображения: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Устанавливаем изображение
      imgElement.src = url;
      // Помечаем как загруженное
      imgElement.setAttribute('data-loaded', 'true');
      
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      // В случае ошибки показываем иконку ошибки
      imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNTM5MzUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PGxpbmUgeDE9IjEyIiB5MT0iOCIgeDI9IjEyIiB5Mj0iMTIiPjwvbGluZT48bGluZSB4MT0iMTIiIHkxPSIxNiIgeDI9IjEyLjAxIiB5Mj0iMTYiPjwvbGluZT48L3N2Zz4=';
    }
  };

  // Обновляем функцию для обработки клика по изображению
  const handleImageClick = async (file) => {
    try {
      setLoading(true);
      
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // Используем новый путь для просмотра изображений
      const imageUrl = `${serverUrl}/uploads/view/${encodeURIComponent(file.filePath)}`;
      
      console.log('Открытие изображения:', {
        url: imageUrl,
        originalName: file.originalName
      });
      
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке изображения: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Ошибка при открытии изображения:', error);
      setError('Ошибка при открытии изображения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-container ${isInModal ? 'chat-in-modal' : ''}`}>
      <div className="chat-header">
        <h3>Чат по заказу #{orderId}</h3>
        {!isInModal && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div className="chat-messages" ref={chatContainerRef}>
        {loadingMessages ? (
          <div className="chat-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Загрузка сообщений...</p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="chat-empty">
            <p>Нет сообщений</p>
            <p>Начните общение прямо сейчас</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.isOwnMessage || (msg.sender && msg.sender.id === user.id) ? 'own-message' : 'other-message'}`}
            >
              <div className="message-content">
                {msg.message && <p>{msg.message}</p>}
                
                {msg.file && renderMessageFile(msg.file)}
                
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              {(!msg.isOwnMessage && msg.sender && msg.sender.id !== user.id) && (
                <div className="message-sender">{msg.sender.fullName}</div>
              )}
            </div>
          ))
        )}
        
        {error && (
          <div className="chat-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="chat-file-preview">
        {selectedFile && (
          <div className="selected-file">
            <i className={getFileIcon(selectedFile.type)}></i>
            <span>{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
        
        <button 
          type="button" 
          className="file-button"
          onClick={handleFileButtonClick}
          disabled={loading}
        >
          <i className="fas fa-paperclip"></i>
        </button>
        
        <button 
          type="submit" 
          disabled={loading || (!message.trim() && !selectedFile)}
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};

export default Chat; 