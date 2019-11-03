domready(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCoYTAfS-1fM1dGt01dTH5HgNxmQcaVFhQ",
    authDomain: "vocreminder.firebaseapp.com",
    databaseURL: "https://vocreminder.firebaseio.com",
    projectId: "vocreminder",
    storageBucket: "vocreminder.appspot.com",
    messagingSenderId: "410444896087",
    appId: "1:410444896087:web:057f8fee55478703879012"
  };
  const defaultProject = firebase.initializeApp(firebaseConfig);
  const db = defaultProject.firestore();

  // app vars
  let selectedName;
  let is_add_dict_open = false;
  let is_edit_view_open = false;
  let is_study_view_open = false;
  let current_translations = [];

  // app actions
  const actions = {
    init: () => {
      if (typeof actions.filter_edit_view_set_input.handle_update == 'undefined') {
        actions.filter_edit_view_set_input.handle_update = debounce((dict_name, word_name) => {
          actions.words_cloud_refresh(dict_name, word_name);
        }, 250);
      }
      if (typeof actions.edit_word_input_changed.handle_update == 'undefined') {
        actions.edit_word_input_changed.handle_update = debounce(() => {
          actions.edit_word_translations_refresh();
        }, 250);
      }
      if (typeof actions.study_translation_input_changed.handle_update == 'undefined') {
        actions.study_translation_input_changed.handle_update = debounce((only_right = false) => {
          actions.study_check_translation(only_right);
        }, 250);
      }
    },
    select_dict: (value) => {
      selectedName = value;
      document.getElementById('add_dict').querySelectorAll('.undline')[1].style.color = !selectedName ? 'red' : 'gray';
      document.getElementById('edit_words').querySelector('.undline').style.color = !selectedName ? 'red' : 'gray';
      if (!selectedName) {
        actions.edit_words_set_view_open(false);
        actions.study_view_set_open(false);
      }
    },
    refreshDicts: () => {
      let dicts = document.getElementById("dicts");
      while (dicts.options.length > 0) dicts.options[0].remove();
      let option = document.createElement("option");
      if (!selectedName) {
        option.selected = true;
      }
      option.disabled = true;
      option.innerText = "Выберите словарь";
      dicts.appendChild(option);
      db.collection('dicts').get().then(qs => qs.forEach((doc) => {
        let option = document.createElement('option');
        option.value = doc.id;
        option.innerText = doc.id;
        if (doc.id === selectedName) option.selected = true;
        dicts.appendChild(option);
      })).catch(error => console.log(error));
    },
    add_dict_set_open: (is_to_open) => {
      is_add_dict_open = is_to_open;
      const add_dict_panel = document.getElementById('add_dict_panel');
      if (is_add_dict_open) {
        add_dict_panel.classList.add('show_01');
        add_dict_panel.classList.remove('hide_01');
      } else {
        add_dict_panel.classList.remove('show_01');
        add_dict_panel.classList.add('hide_01');
      }
      if (is_add_dict_open) document.getElementById("add_dict_input").value = selectedName ? selectedName : "new-" + Math.round(Math.random() * 1000);
    },
    add_dict_plus_fire: () => {
      let input = document.getElementById("add_dict_input");
      const value = input.value;
      if (value != "") {
        db.collection('dicts')
          .doc(value).set({words : []})
          .then(() => {
            actions.select_dict(value);
            actions.refreshDicts();
          })
          .catch((error) => console.log(error));
      }
      input.value = "";
      actions.add_dict_set_open(false);
    },
    add_dict_minus_fire: () => {
      let input = document.getElementById("add_dict_input");
      const value = input.value;
      if (value != "") {
        db.collection('dicts')
        .doc(value).get()
        .then(doc => {
          if (doc.exists && doc.data().words) {
            doc.data().words.forEach(word =>
              db.collection('dicts').doc(value).collection('words').doc(word).delete()
              .catch(error => console.log(error))
            );
          }
        })
        .then(() => db.collection('dicts').doc(value).delete())
        .then(() => {
          if (value === selectedName) actions.select_dict(null);
          actions.refreshDicts();
        })
        .catch((error) => console.log(error));
      }
      input.value = "";
      actions.add_dict_set_open(false);
    },
    edit_words_set_view_open: (is_to_open) => {
      is_edit_view_open = selectedName ? is_to_open : false;
      const edit_view = document.getElementById('edit_view');
      if (is_edit_view_open) {
        edit_view.classList.add('show_02');
        edit_view.classList.remove('hide_01');
        actions.study_view_set_open(false);
      } else {
        edit_view.classList.remove('show_02');
        edit_view.classList.add('hide_01');
      }
      actions.filter_edit_view_set_input("");
    },
    filter_edit_view_set_input: (value, need_update = true) => {
      const filter_edit_view = document.getElementById("filter_edit_view");
      if (!need_update && !value) value = filter_edit_view.value;
      actions.edit_translations_set_open(value.length > 0);
      actions.edit_word_panel_set_open(value.length > 0);
      if (need_update) filter_edit_view.value = value;
      document.getElementById("edit_word_input").value = value;
      if (value == "") actions.edit_word_input_changed();
      actions.init();
      actions.filter_edit_view_set_input.handle_update(selectedName, value);
      actions.edit_word_input_changed();
    },
    edit_word_panel_set_open: (is_to_open) => {
      const edit_word_panel = document.getElementById('edit_word_panel');
      if (is_to_open) {
        edit_word_panel.classList.add('show_01');
        edit_word_panel.classList.remove('hide_01');
      } else {
        edit_word_panel.classList.remove('show_01');
        edit_word_panel.classList.add('hide_01');
      }
    },
    edit_translations_set_open: (is_to_open) => {
      const edit_translations = document.getElementById('edit_translations');
      if (is_to_open) {
        edit_translations.classList.add('show_02');
        edit_translations.classList.remove('hide_01');
      } else {
        edit_translations.classList.remove('show_02');
        edit_translations.classList.add('hide_01');
      }
    },
    words_cloud_refresh: (dict_name, filter) => {
      const words_cloud = document.getElementById('words_cloud');
      const edit_word_input = document.getElementById('edit_word_input');
      words_cloud.innerHTML = '';
      if (dict_name) {
        db.collection('dicts').doc(dict_name).get()
        .then(dictDoc => {
          if (dictDoc.exists && dictDoc.data().words) {
            dictDoc.data().words.forEach(word => {
              if (!filter || word.indexOf(filter) >= 0) {
                const elem = document.createElement('a');
                elem.href = "#";
                elem.className = "undline";
                elem.appendChild(document.createTextNode(word));
                elem.onclick = () => {
                  edit_word_input.value = word;
                  actions.edit_word_panel_set_open(true);
                  actions.edit_translations_set_open(true);
                  actions.edit_word_translations_refresh();
                }
                words_cloud.appendChild(elem);
                words_cloud.appendChild(document.createTextNode(", "));
              }
            })
          }
          if (words_cloud.lastChild) words_cloud.removeChild(words_cloud.lastChild);
        })
        .catch((error) => console.log(error));
      }
    },
    edit_word_input_changed: () => {
      actions.init();
      actions.edit_word_input_changed.handle_update();
    },
    edit_word_translations_refresh: () => {
      const edit_translations = document.getElementById('edit_translations');
      const edit_word_input_value = document.getElementById("edit_word_input").value;
      edit_translations.innerHTML = '';
      const empty = document.createElement('input');
      empty.className = 'br';
      empty.oninput = () => actions.edit_translations_changed();
      actions.focus_next_to(empty);
      edit_translations.appendChild(empty);
      if (selectedName && !!edit_word_input_value) {
        db.collection('dicts').doc(selectedName).collection('words').doc(edit_word_input_value).get()
        .then(wordDoc => {
          if (wordDoc.exists && wordDoc.data().translations) {
            edit_translations.innerHTML = '';
            wordDoc.data().translations.forEach(tr => {
              const opt = document.createElement('input');
              opt.className = 'br';
              opt.value = tr;
              opt.oninput = () => actions.edit_translations_changed();
              actions.focus_next_to(opt);
              edit_translations.appendChild(opt);
            });
            edit_translations.appendChild(empty)
          };
        }).catch(error => console.log(error));
      }
    },
    edit_translations_changed: () => {
      const edit_translations = document.getElementById('edit_translations');
      let translations = edit_translations.querySelectorAll('input');
      if (translations.length > 0 && translations[translations.length - 1].value.length > 0) {
        const empty = document.createElement('input');
        empty.className = 'br';
        empty.oninput = () => actions.edit_translations_changed();
        actions.focus_next_to(empty);
        edit_translations.appendChild(empty);
      }
      while (translations.length > 1 && translations[translations.length - 1].value === '' && translations[translations.length - 2].value === '') {
        edit_translations.removeChild(edit_translations.lastChild);
        translations = edit_translations.querySelectorAll('input');
      }
      if (!(document.activeElement instanceof HTMLInputElement)) edit_translations.lastChild.focus();
    },
    focus_next_to: (element) => {
      element.onkeyup = (e) => {
        const moveTo = (delta) => {
          e.preventDefault();
          const inputs = document.getElementById('edit_translations').querySelectorAll('input');
          let found;
          inputs.forEach((el, ind) => {
            if (el === element) found = ind;
          });
          inputs[(found + delta + inputs.length) % inputs.length].focus();
        };
        if (e.keyCode === 13) moveTo(+1);
        if (e.keyCode === 40 || (e.keyCode === 39 && element.selectionStart === element.value.length)) moveTo(+1);
        if (e.keyCode === 38 || (e.keyCode === 37 && element.selectionStart === 0)) moveTo(-1);
      };
    },
    edit_word_plus_fire: () => {
      const edit_word_input_value = document.getElementById("edit_word_input").value;
      const translations = [...document.getElementById('edit_translations').querySelectorAll('input')].map(item => item.value).filter(item => !!item);
      db.collection('dicts').doc(selectedName).collection('words').doc(edit_word_input_value).set({up: 3, down: 3, translations})
      .then(() => db.collection('dicts').doc(selectedName).update({words: firebase.firestore.FieldValue.arrayUnion(edit_word_input_value)}))
      .then(() => actions.words_cloud_refresh(selectedName))
      .catch(error => console.log(error));
    },
    edit_word_minus_fire: () => {
      const edit_word_input_value = document.getElementById("edit_word_input").value;
      db.collection('dicts').doc(selectedName).collection('words').doc(edit_word_input_value).delete()
      .then(() => db.collection('dicts').doc(selectedName).update({words: firebase.firestore.FieldValue.arrayRemove(edit_word_input_value)}))
      .then(() => actions.filter_edit_view_set_input(null, false))
      .catch(error => console.log(error));
    },
    start_study_clicked: () => {
      if (!is_study_view_open) {
        const start_course_warning = document.getElementById('start_course_warning');
        if (selectedName) {
          start_course_warning.classList.remove('show_02');
          start_course_warning.classList.add('hide_01');
        } else {
          start_course_warning.classList.add('show_02');
          start_course_warning.classList.remove('hide_01');
        }
      }
      actions.study_view_set_open(!is_study_view_open);
    },
    study_view_set_open: (is_to_open) => {
      is_study_view_open = selectedName ? is_to_open : false;
      const study_view = document.getElementById('study_view');
      if (is_study_view_open) {
        study_view.classList.add('show_02');
        study_view.classList.remove('hide_01');
        actions.edit_words_set_view_open(false);
      } else {
        study_view.classList.remove('show_02');
        study_view.classList.add('hide_01');
      }
      actions.study_view_show_word(is_study_view_open);
    },
    study_view_show_word: (is_to_show = true) => {
      const study_word = document.getElementById("study_word");
      study_word.innerText = "--";
      if (!is_to_show) {
        document.getElementById("study_results_view").innerHTML = "";
      } else {
        db.collection('dicts').doc(selectedName).get()
        .then(dict => {
          if (dict.exists && dict.data().words && dict.data().words.length > 0) {
            Promise.all( dict.data().words.map(word => db.collection('dicts').doc(selectedName).collection('words').doc(word).get()) )
            .then(results => {
              const words = results.map(doc => doc.exists ? [doc.id, doc.data()] : null).filter(item => item != null);
              const list = words.map(item => item[0]);
              const weight = words.map(item => (item[1].down + Number.EPSILON) / (item[1].down + item[1].up + Number.EPSILON));
              const chosen_word = getRandomItem(list, weight);
              current_translations = words[list.indexOf(chosen_word)][1].translations;
              study_word.innerText = chosen_word;
              const study_translation = document.getElementById('study_translation');
              study_translation.value = '';
              study_translation.focus();
            }).catch(error => console.log(error));
          }
        })
        .catch(error => console.log(error));
      }
    },
    study_translation_input_changed: () => {
      actions.init();
      actions.study_translation_input_changed.handle_update(true);
    },
    study_check_translation: (only_right = false) => {
      const study_translation_value = document.getElementById('study_translation').value;
      const study_word_value = document.getElementById("study_word").innerText;
      if (study_word_value != '--') {
        let is_alike = current_translations.filter(tr => tr.toLowerCase() === study_translation_value.toLowerCase()).length > 0;
        if (is_alike || !only_right) {
          const r = document.createElement('li');
          r.style.color = is_alike ? "green" : "red";
          r.innerText = study_word_value + " — " + study_translation_value;
          const study_results_view = document.getElementById('study_results_view');
          study_results_view.prepend(r);
          db.collection('dicts').doc(selectedName).collection('words').doc(study_word_value).update({[is_alike ? 'up' : 'down'] : firebase.firestore.FieldValue.increment(1)})
          .then(() => actions.study_view_show_word())
          .catch(error => console.log(error));
        }
      }
    }
  }

  // app hooks
  document.getElementById('dicts').onchange = (e) => actions.select_dict(e.target.value);
  document.getElementById("add_dict").onclick = () => actions.add_dict_set_open(!is_add_dict_open);
  document.getElementById("add_dict_plus").onclick = () => actions.add_dict_plus_fire();
  document.getElementById("add_dict_minus").onclick = () => actions.add_dict_minus_fire();
  document.getElementById('edit_words').onclick = () => actions.edit_words_set_view_open(!is_edit_view_open);
  document.getElementById("filter_edit_view").oninput = (e) => actions.filter_edit_view_set_input(e.target.value, false);
  document.getElementById("edit_word_input").oninput = (e) => actions.edit_word_input_changed();
  document.getElementById('edit_word_plus').onclick = () => actions.edit_word_plus_fire();
  document.getElementById('edit_word_minus').onclick = () => actions.edit_word_minus_fire();
  document.getElementById('start_study').onclick = () => actions.start_study_clicked();
  document.getElementById('study_translation').oninput = () => actions.study_translation_input_changed();
  document.getElementById('study_word').onclick = () => actions.study_check_translation();

  // utils
  function delay(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
  const highlighter = (e) => {
    const r = 10;
    const x = e.clientX, y = e.clientY;
    const overlay = document.createElement("div");
    overlay.style.position = 'fixed';
    overlay.style.top = -r + y + 'px';
    overlay.style.left = -r + x + 'px';
    overlay.style.border = "5px solid rgba(238, 255, 0, 0.5)";
    overlay.style.width = 2*r + "px";
    overlay.style.height = 2*r + "px";
    overlay.style.borderRadius = r + "px";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);
    delay(AVERAGE_DELAY / 2)
    .then(() => overlay.parentNode.removeChild(overlay))
    .catch((error) => console.log(error));
  }
  //https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript
  function simulate(element, eventName) {
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers) {
      if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType) throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent) {
      oEvent = document.createEvent(eventType);
      if (eventType == 'HTMLEvents') {
          oEvent.initEvent(eventName, options.bubbles, options.cancelable);
      } else {
          oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
          options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
          options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
      }
      highlighter(oEvent);
      delay(AVERAGE_DELAY / 2).then(() => element.dispatchEvent(oEvent)).catch(error => console.log(error));
    } else {
      options.clientX = options.pointerX;
      options.clientY = options.pointerY;
      var evt = document.createEventObject();
      oEvent = extend(evt, options);
      highlighter(oEvent);
      delay(AVERAGE_DELAY / 2).then(() => element.fireEvent('on' + eventName, oEvent)).catch(error => console.log(error));
    }
    return element;
  }
  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }
  var eventMatchers = {
      'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
      'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
  }
  var defaultOptions = {
      pointerX: 0,
      pointerY: 0,
      button: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true
  }
  // highlighted click
  const lightedClick = (component) => {
    const rect = component.getBoundingClientRect();
    const xc = rect.x + rect.width / 2, yc = rect.y + rect.height / 2;
    simulate(component, "click", { pointerX: xc, pointerY: yc });
  }
  //https://codetheory.in/weighted-biased-random-number-generation-with-javascript-based-on-probability/
  const rand = (min, max) => {
    return Math.random() * (max - min) + min;
  };
  const getRandomItem = (list, weight) => {
    const total_weight = weight.reduce((prev, cur, i, arr) => prev + cur, 0);

    const random_num = rand(0, total_weight);
    let weight_sum = 0;

    for (let i = 0; i < list.length; i++) {
      weight_sum += weight[i];
      if (random_num <= weight_sum) return list[i];
    }
  };

  // is test complete
  const tests = {
    test1: false,
    test2: false
  }
  const AVERAGE_DELAY = 2000;
  // test create
  document.getElementById('test1').onclick = () => {
    const add_dict = document.getElementById('add_dict');
    lightedClick(add_dict);//.click();
    delay(AVERAGE_DELAY).then(() => {
      const add_dict_input = document.getElementById('add_dict_input');
      lightedClick(add_dict_input);
      add_dict_input.value = 'asdf';
      return delay(AVERAGE_DELAY);
    }).then(() => {
      const add_dict_plus = document.getElementById('add_dict_plus');
      lightedClick(add_dict_plus);
      return delay(AVERAGE_DELAY);
    }).then(() => {
      const dicts = document.getElementById('dicts');
      console.assert(dicts.value === 'asdf', 'Словарь не был создан');
      tests.test1 = true;
    }).catch((error) => console.log(error));
  }
  // test edit
  document.getElementById('test2').onclick = async () => { // Создать 'asdf' словарь если его нет и выбрать его
    const dicts = document.getElementById('dicts');
    if ([...dicts.options].filter(item => item.value === 'asdf').length == 0) {
      lightedClick(document.getElementById('test1'));
      while (!tests.test1) await delay(AVERAGE_DELAY);
    }
    lightedClick(dicts);
    dicts.value = 'asdf';
    dicts.dispatchEvent(new Event('change'));
    delay(AVERAGE_DELAY).then(() => { // Выбрать редактирование словаря, если оно уже не выбрано
      if (document.getElementById('edit_view').classList.contains('hide_01')) {
        const edit_words = document.getElementById('edit_words');
        lightedClick(edit_words);
      }
      return delay(AVERAGE_DELAY);
    }).then(() => { // Отфильтровать слова по маске 'newword'
      const filter_edit_view = document.getElementById('filter_edit_view');
      lightedClick(filter_edit_view);
      return delay(AVERAGE_DELAY);
    }).then(() => { // Отфильтровать слова по маске 'newword'
      const filter_edit_view = document.getElementById('filter_edit_view');
      filter_edit_view.value = 'newword';
      filter_edit_view.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      lightedClick(edit_translations.lastChild);
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      edit_translations.lastChild.value = 'some';
      edit_translations.lastChild.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      lightedClick(edit_translations.lastChild);
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      edit_translations.lastChild.value = 'new';
      edit_translations.lastChild.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      lightedClick(edit_translations.lastChild);
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // После того, как 'newword' будет автоматически добавлен для редактирования, вставить переводы: 'some', 'new', 'translation'
      const edit_translations = document.getElementById('edit_translations');
      edit_translations.lastChild.value = 'translation';
      edit_translations.lastChild.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // Подтверждение изменения записи 'newword'
      const edit_word_plus = document.getElementById('edit_word_plus');
      lightedClick(edit_word_plus);
      return delay(AVERAGE_DELAY);
    }).then(() => { // Почистить фильтр слов
      const filter_edit_view = document.getElementById('filter_edit_view');
      lightedClick(filter_edit_view);
      return delay(AVERAGE_DELAY);
    }).then(() => { // Почистить фильтр слов
      const filter_edit_view = document.getElementById('filter_edit_view');
      filter_edit_view.value = '';
      filter_edit_view.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // В обновлённом облаке слов проверить наличие 'newword' ссылки и кликнуть по ней
      const words_cloud = document.getElementById('words_cloud');
      const newwords = [...words_cloud.querySelectorAll('a')].filter(item => item.innerText === 'newword');
      console.assert(newwords.length === 1, newwords, 'Должно быть ровно одно слово "newword"');
      lightedClick(newwords[0]);
      return delay(AVERAGE_DELAY);
    }).then(() => { // Удалить запись 'newword'
      const edit_word_minus = document.getElementById('edit_word_minus');
      lightedClick(edit_word_minus);
      return delay(AVERAGE_DELAY);
    }).then(() => { // Закрыть панель редактирования слов
      const edit_words = document.getElementById('edit_words');
      lightedClick(edit_words);
      tests.test2 = true;
      return delay(AVERAGE_DELAY);
    }).catch((error) => console.log(error));
  }
  // test study
  const dictName = 'new-' + Math.round(rand(0, 1000));
  document.getElementById('test3').onclick = () => {// Искусственно создадим словарь _dictName_ с наполнением
    db.collection('dicts').doc(dictName).set({words: ['one', 'two', 'free']})
    .then(async () => {
      await db.collection('dicts').doc(dictName).collection('words').doc('one').set({up: 0, down: 0, translations: ['один']});
      await db.collection('dicts').doc(dictName).collection('words').doc('two').set({up: 0, down: 0, translations: ['два']});
      await db.collection('dicts').doc(dictName).collection('words').doc('free').set({up: 0, down: 0, translations: ['свободный']});
      actions.refreshDicts();
      return delay(AVERAGE_DELAY);
    }).then(() => { // Выбираем только что созданный словарь _dictName_
      const dicts = document.getElementById('dicts');
      lightedClick(dicts);
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // Выбираем только что созданный словарь _dictName_
      const dicts = document.getElementById('dicts');
      dicts.value = dictName;
      dicts.dispatchEvent(new Event('change'));
      return delay(AVERAGE_DELAY / 2);
    }).then(() => { // Начинаем обучение
      lightedClick(document.getElementById('start_study'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Вводим перевод появившегося слова
      lightedClick(document.getElementById('study_translation'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Вводим правильный перевод появившегося слова
      const study_translation = document.getElementById('study_translation');
      study_translation.value = {'one': 'один', 'two': 'два', 'free': 'свободный'}[document.getElementById('study_word').innerText];
      study_translation.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Вводим правильный перевод появившегося слова
      const study_translation = document.getElementById('study_translation');
      study_translation.value = {'one': 'один', 'two': 'два', 'free': 'свободный'}[document.getElementById('study_word').innerText];
      study_translation.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Вводим НЕправильный перевод появившегося слова
      const study_translation = document.getElementById('study_translation');
      study_translation.value = {'one': 'одн', 'two': 'двва', 'free': 'три'}[document.getElementById('study_word').innerText];
      study_translation.dispatchEvent(new Event('input'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Так как мы ошиблись с переводом, то вынужденые нажать на слово, чтобы выдалось следующее
      lightedClick(document.getElementById('study_word'));
      return delay(AVERAGE_DELAY);
    }).then(() => { // Проверяем, что у нас ровно 2 правильных и 1 неправильный перевод
      const study_results_view = document.getElementById('study_results_view');
      console.assert(study_results_view.querySelectorAll("li[style='color: green;']").length == 2, 'Должно быть ровно два правильных перевода');
      console.assert(study_results_view.querySelectorAll("li[style='color: red;']").length == 1, 'Должно быть ровно один неправильный перевод');
    }).catch(error => console.log(error));
  }

  // app initialization
  actions.select_dict(null);
  actions.refreshDicts();
})
