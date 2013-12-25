

silex.utils.dom.resolveTemplate = function (template, data) {
  var res = '';
  // for each item in data, e.g. each page in the list
  for (itemIdx in data){
    // build an item
    var item = template;
    // replace each key by its value
    for (key in data[itemIdx]){
      var value = data[itemIdx][key];
      item = item.replace(key, value);
    }
    // add the item to the rendered template
    res += item;
  }
  return res;
}
