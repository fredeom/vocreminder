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

  // app actions
  const actions = {
    select_dict: (value) => {
      selectedName = value;
      document.getElementById('add_dict').querySelectorAll('.undline')[1].style.color = !selectedName ? 'red' : 'gray';
      document.getElementById('edit_words').querySelector('.undline').style.color = !selectedName ? 'red' : 'gray';
      if (!selectedName)actions.edit_words_set_view_open(false);
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
      db.collection('dicts').get().then((qs) => qs.forEach((doc) => {
        let option = document.createElement('option');
        option.value = doc.id;
        option.innerText = doc.id;
        if (doc.id === selectedName) option.selected = true;
        dicts.appendChild(option);
      })).catch((error) => console.log(error));
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
          .doc(value).set({some : 1})
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
          .doc(value).delete()
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
      } else {
        edit_view.classList.remove('show_02');
        edit_view.classList.add('hide_01');
        actions.filter_edit_view_set_input("");
      }
    },
    filter_edit_view_set_input: (value, need_update = true) => {
      const edit_word_panel = document.getElementById('edit_word_panel');
      if (value.length > 0) {
        edit_word_panel.classList.add('show_01');
        edit_word_panel.classList.remove('hide_01');
      } else {
        edit_word_panel.classList.remove('show_01');
        edit_word_panel.classList.add('hide_01');
      }
      if (need_update) document.getElementById("filter_edit_view").value = value;
      document.getElementById("edit_word_input").value = value;
    }
  }

  // app hooks
  document.getElementById('dicts').onchange = (e) => actions.select_dict(e.target.value);
  document.getElementById("add_dict").onclick = () => actions.add_dict_set_open(!is_add_dict_open);
  document.getElementById("add_dict_plus").onclick = () => actions.add_dict_plus_fire();
  document.getElementById("add_dict_minus").onclick = () => actions.add_dict_minus_fire();
  document.getElementById('edit_words').onclick = () => actions.edit_words_set_view_open(!is_edit_view_open);
  document.getElementById("filter_edit_view").oninput = (e) => actions.filter_edit_view_set_input(e.target.value, false);

  // app initialization
  actions.select_dict(null);
  actions.refreshDicts();
})
