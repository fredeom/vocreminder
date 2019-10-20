domready(() => {
  var firebaseConfig = {
    apiKey: "AIzaSyCoYTAfS-1fM1dGt01dTH5HgNxmQcaVFhQ",
    authDomain: "vocreminder.firebaseapp.com",
    databaseURL: "https://vocreminder.firebaseio.com",
    projectId: "vocreminder",
    storageBucket: "vocreminder.appspot.com",
    messagingSenderId: "410444896087",
    appId: "1:410444896087:web:057f8fee55478703879012"
  };
  var defaultProject = firebase.initializeApp(firebaseConfig);
  var db = defaultProject.firestore();

  document.getElementById('dicts').onchange = (e) => selectedName = e.target.value;
  var is_add_dict_open = false;
  document.getElementById("add_dict").onclick = () => {
    is_add_dict_open = !is_add_dict_open;
    const add_dict_panel = document.getElementById('add_dict_panel');
    if (is_add_dict_open) {
      add_dict_panel.classList.add('show_01');
      add_dict_panel.classList.remove('hide_01');
    } else {
      add_dict_panel.classList.remove('show_01');
      add_dict_panel.classList.add('hide_01');
    }
    if (is_add_dict_open) document.getElementById("add_dict_input").value = selectedName ? selectedName : "new-" + Math.round(Math.random() * 1000);
  }
  const refreshDicts = () => {
    let dicts = document.getElementById("dicts");
    while (dicts.options.length > 0) dicts.options[0].remove();
    let option = document.createElement("option");
    if (!selectedName) option.selected = true;
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
  }
  var selectedName;
  refreshDicts();
  document.getElementById("add_dict_plus").onclick = () => {
    let input = document.getElementById("add_dict_input");
    const value = input.value;
    if (value != "") {
      db.collection('dicts')
        .doc(value).set({some : 1})
        .then(() => {
          selectedName = value;
          refreshDicts();
        })
        .catch((error) => console.log(error));
    } else {
      selectedName = null;
      refreshDicts();
    }
    input.value = "";
    document.getElementById("add_dict").click();
  }
  document.getElementById("add_dict_minus").onclick = () => {
    let input = document.getElementById("add_dict_input");
    const value = input.value;
    if (value != "") {
      db.collection('dicts')
        .doc(value).delete()
        .then(() => {
          selectedName = null;
          refreshDicts();
        })
        .catch((error) => console.log(error));
    } else {
      selectedName = null;
      refreshDicts();
    }
    input.value = "";
    document.getElementById("add_dict").click();
  }

  var is_edit_view_open = false;
  document.getElementById('edit_words').onclick = () => {
    is_edit_view_open = !is_edit_view_open;
    const edit_view = document.getElementById('edit_view');
    if (is_edit_view_open) {
      edit_view.classList.add('show_02');
      edit_view.classList.remove('hide_01');
    } else {
      edit_view.classList.remove('show_02');
      edit_view.classList.add('hide_01');
      filter_edit_view_set_input("");
    }
  }
  const filter_edit_view_set_input = (value, need_update = true) => {
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
  document.getElementById("filter_edit_view").oninput = (e) => {
    filter_edit_view_set_input(e.target.value, false);
  }
})
