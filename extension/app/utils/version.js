
export function greaterThan(v1, v2) {
  if (!v1) {
    v1 = '0.0.7'; // we only started doing this in 0.0.8
  }

  const v1Parts = v1.split('.').map(x => parseInt(x, 10));
  const v2Parts = v2.split('.').map(x => parseInt(x, 10));

  for (let i = 0; i < 3; i += 1) {
    const v1Part = v1Parts[i];
    const v2Part = v2Parts[i];

    if (v1Part > v2Part) {
      return true;
    }
    if (v1Part < v2Part) {
      return false;
    }
  }
  // they were the same the whole way.
  return false;
}

/* we're looking for recomputations, reset recomputations */
export function greaterThan007(v1) {
  return greaterThan(v1, '0.0.7');
}
