export function objectsDiff(oldObj, newObj) {
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);
  const added = [];
  const updated = [];

   newKeys.forEach(key => {
    if (!(key in oldObj)) {
      added.push(key);
    }    
    if (key in oldObj && oldObj[key] !== newObj[key]) {
      updated.push(key);
    }
  });
  return {
    added,
    removed: oldKeys.filter((key) => !(key in newObj)),
    updated,
  };
}
