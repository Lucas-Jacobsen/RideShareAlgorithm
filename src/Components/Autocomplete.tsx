
interface AutocompleteOptions {
    placeholder: string;
  }

  type AutocompleteCallback = (data: string | null) => void;

function addressAutocomplete(containerElement: HTMLElement, callback: AutocompleteCallback, options: AutocompleteOptions): void {
    const MIN_ADDRESS_LENGTH = 3;
    const DEBOUNCE_DELAY = 300;

    let currentItems: string[] = [];
    let focusedItemIndex: number;

    const inputContainerElement = document.createElement("div");
    inputContainerElement.setAttribute("class", "input-container");
    containerElement.appendChild(inputContainerElement);

    const inputElement = document.createElement("input");
    inputElement.setAttribute("type", "text");
    inputElement.setAttribute("placeholder", options.placeholder);
    inputContainerElement.appendChild(inputElement);

    const clearButton = document.createElement("div");
    clearButton.classList.add("clear-button");
    clearButton.addEventListener("click", (e) => {
      e.stopPropagation();
      inputElement.value = '';
      callback(null);
      clearButton.classList.remove("visible");
      closeDropDownList();
    });
    inputContainerElement.appendChild(clearButton);

    let currentTimeout: number | NodeJS.Timeout | null = null;
    let currentPromiseReject: ((reason?: unknown) => void) | null = null;

    inputElement.addEventListener("input", function () {
      const currentValue = this.value;
      closeDropDownList();

      if (currentTimeout) {
        clearTimeout(currentTimeout as number); // Cast to number
      }

      if (currentPromiseReject) {
        currentPromiseReject({
          canceled: true
        });
      }

      if (!currentValue) {
        clearButton.classList.remove("visible");
      }

      clearButton.classList.add("visible");

      if (!currentValue || currentValue.length < MIN_ADDRESS_LENGTH) {
        return false;
      }

      currentTimeout = setTimeout(() => {
        currentTimeout = null;

        const promise = new Promise<string[]>((resolve, reject) => {
          currentPromiseReject = reject;
          const apiKey = "089e0f2da3c74cda9a70e7b58212ed47"; 
          const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(currentValue)}&format=json&limit=5&apiKey=${apiKey}`;

          fetch(url)
            .then(response => {
              currentPromiseReject = null;
              if (response.ok) {
                response.json().then(data => resolve(data.results.map((result: { formatted: string }) => result.formatted)));
              } else {
                response.json().then(data => reject(data));
              }
            });
        });

        promise.then((data) => {
          currentItems = data;
          const autocompleteItemsElement = document.createElement("div");
          autocompleteItemsElement.setAttribute("class", "autocomplete-items");
          inputContainerElement.appendChild(autocompleteItemsElement);

          data.forEach((result, index) => {
            const itemElement = document.createElement("div");
            itemElement.innerHTML = result;
            autocompleteItemsElement.appendChild(itemElement);

            itemElement.addEventListener("click", function () {
              inputElement.value = currentItems[index];
              callback(currentItems[index]);
              closeDropDownList();
            });
          });
        }, (err) => {
          if (!err.canceled) {
            console.log(err);
          }
        });
      }, DEBOUNCE_DELAY);
    });

    inputElement.addEventListener("keydown", function (e) {
      const autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
      if (autocompleteItemsElement) {
        const itemElements = autocompleteItemsElement.getElementsByTagName("div");
        if (e.keyCode == 40) {
          e.preventDefault();
          focusedItemIndex = focusedItemIndex !== itemElements.length - 1 ? focusedItemIndex + 1 : 0;
          setActive(itemElements, focusedItemIndex);
        } else if (e.keyCode == 38) {
          e.preventDefault();
          focusedItemIndex = focusedItemIndex !== 0 ? focusedItemIndex - 1 : focusedItemIndex = (itemElements.length - 1);
          setActive(itemElements, focusedItemIndex);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (focusedItemIndex > -1) {
            closeDropDownList();
          }
        }
      } else {
        if (e.keyCode == 40) {
          const event = document.createEvent('Event');
          event.initEvent('input', true, true);
          inputElement.dispatchEvent(event);
        }
      }
    });

    function setActive(items: HTMLCollectionOf<Element>, index: number) {
      if (!items || !items.length) return false;

      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("autocomplete-active");
      }

      items[index].classList.add("autocomplete-active");

      inputElement.value = currentItems[index];
      callback(currentItems[index]);
    }

    function closeDropDownList() {
      const autocompleteItemsElement = inputContainerElement.querySelector(".autocomplete-items");
      if (autocompleteItemsElement) {
        inputContainerElement.removeChild(autocompleteItemsElement);
      }

      focusedItemIndex = -1;
    }
  }

  export default addressAutocomplete;
