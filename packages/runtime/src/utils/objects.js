export function objectsDiff(oldObj, newObj) {
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);
  // TODO: Optimize this function to avoid multiple iterations
  return {
    added: newKeys.filter((key) => !(key in oldObj)),
    removed: oldKeys.filter((key) => !(key in newObj)),
    updated: newKeys.filter(
      (key) => key in oldObj && oldObj[key] !== newObj[key]
    ),
  };
}
