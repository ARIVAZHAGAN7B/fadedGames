mergeInto(LibraryManager.library, {
  BookCricketPostEvent: function (eventNamePtr, payloadPtr) {
    var eventName = UTF8ToString(eventNamePtr);
    var payloadText = UTF8ToString(payloadPtr);
    var payload = payloadText;

    try {
      payload = JSON.parse(payloadText);
    } catch (error) {
      payload = payloadText;
    }

    window.dispatchEvent(
      new CustomEvent("book-cricket:event", {
        detail: {
          eventName: eventName,
          payload: payload
        }
      })
    );
  }
});
