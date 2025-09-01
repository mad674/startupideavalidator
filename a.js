function mergeArrays(a,b,c){
  return [...a,...b,...c];
}
console.log(mergeArrays([1,2],[3,4],[4,5]));