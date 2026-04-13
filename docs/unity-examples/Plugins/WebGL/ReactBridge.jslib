var ReactBridge = {
  // Отправка данных в React
  SendToReact: function(commandPtr, dataPtr) {
    var command = UTF8ToString(commandPtr);
    var data = UTF8ToString(dataPtr);
    
    // Отправляем кастомное событие
    window.dispatchEvent(new CustomEvent('unity-command', {
      detail: {
        command: command,
        data: JSON.parse(data)
      }
    }));
  },

  // Получение данных из React
  RegisterListener: function(eventNamePtr) {
    var eventName = UTF8ToString(eventNamePtr);
    
    window.addEventListener(eventName, function(e) {
      // Вызываем метод в Unity
      SendMessage('ReactBridge', 'OnDataReceived', JSON.stringify(e.detail));
    });
  },

  // Уведомление о готовности Unity
  NotifyUnityReady: function() {
    window.dispatchEvent(new CustomEvent('unity-ready', {
      detail: { timestamp: Date.now() }
    }));
  }
};

mergeInto(LibraryManager.library, ReactBridge);
