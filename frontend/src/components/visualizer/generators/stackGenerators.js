function stackSnap(stack, inputArray, resultArray, currentIndex, meta = {}, stack2 = null) {
  return {
    type: 'stack',
    stack:        stack.map(s => ({ ...s })),
    stack2:       stack2 ? stack2.map(s => ({ ...s })) : null,
    inputArray:   inputArray  ? inputArray.map(s => ({ ...s }))  : null,
    resultArray:  resultArray ? resultArray.map(s => ({ ...s })) : null,
    currentIndex,
    message:      meta.message   || '',
    variables:    meta.variables || {},
    phase:        meta.phase     || '',
    stackLabel:   meta.stackLabel || 'Stack',
  };
}

// ─── Next Greater Element ──────────────────────────────────────────────────────
export function generateNextGreaterElementFrames(array = [4, 5, 2, 10, 8]) {
  const frames = [];
  const n = array.length;
  const result = Array(n).fill(-1);
  const stack  = []; // stores indices

  const inputSnap = (over = {}) =>
    array.map((v, i) => ({ value: v, state: over[i] || (i < frames.length ? 'processed' : 'default') }));

  frames.push(stackSnap([], array.map(v => ({ value: v, state: 'default' })), result.map(v => ({ value: v, state: 'default' })), null, {
    message: `Next Greater Element: for each element, find the next element that is greater. Use monotonic stack.`,
    phase: 'Initialize',
  }));

  for (let i = 0; i < n; i++) {
    // Pop elements smaller than current
    while (stack.length > 0 && array[stack[stack.length - 1]] < array[i]) {
      const idx = stack.pop();
      result[idx] = array[i];

      const input = array.map((v, k) => ({
        value: v,
        state: k === i ? 'current' : k === idx ? 'comparing' : k < i ? 'processed' : 'default',
      }));
      const res   = result.map((v, k) => ({ value: v === -1 ? '?' : v, state: k === idx ? 'ngResult' : v !== -1 ? 'matched' : 'default' }));
      const st    = stack.map(si => ({ value: array[si], state: 'top' }));

      frames.push(stackSnap(st, input, res, i, {
        message: `arr[${idx}]=${array[idx]} < arr[${i}]=${array[i]}. Next greater for arr[${idx}] is ${array[i]}. Pop.`,
        variables: { current: array[i], popped: array[idx], result: idx },
        phase: `NGE for arr[${idx}]`,
      }));
    }

    // Push current
    stack.push(i);
    const input2 = array.map((v, k) => ({
      value: v,
      state: k === i ? 'pushed' : k < i ? 'processed' : 'default',
    }));
    const st2 = stack.map(si => ({ value: array[si], state: si === i ? 'top' : 'default' }));
    const res2 = result.map((v, k) => ({ value: v === -1 ? '?' : v, state: v !== -1 ? 'matched' : 'default' }));

    frames.push(stackSnap(st2, input2, res2, i, {
      message: `Push arr[${i}]=${array[i]} onto stack. Stack: [${stack.map(si => array[si]).join(', ')}]`,
      variables: { pushed: array[i], stackSize: stack.length },
      phase: `Push ${array[i]}`,
    }));
  }

  const finalResult = result.map((v, k) => ({ value: v === -1 ? -1 : v, state: v !== -1 ? 'matched' : 'default' }));
  frames.push(stackSnap([], array.map(v => ({ value: v, state: 'processed' })), finalResult, null, {
    message: `NGE complete. Result: [${result.join(', ')}]`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Valid Parentheses ────────────────────────────────────────────────────────
export function generateValidParenthesesFrames(str = '({[]})') {
  const frames = [];
  const matching = { ')': '(', '}': '{', ']': '[' };
  const opens  = new Set(['(', '{', '[']);
  let stack = [];
  let valid = true;

  frames.push(stackSnap([], str.split('').map(c => ({ value: c, state: 'default' })), null, null, {
    message: `Valid Parentheses: push opening brackets, pop + match for closing brackets. Input: "${str}"`,
    phase: 'Initialize',
  }));

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const input = str.split('').map((c, k) => ({
      value: c,
      state: k === i ? 'current' : k < i ? 'processed' : 'default',
    }));

    if (opens.has(ch)) {
      stack.push(ch);
      const st = stack.map((c, k) => ({ value: c, state: k === stack.length - 1 ? 'top' : 'default' }));
      frames.push(stackSnap(st, input, null, i, {
        message: `'${ch}' is an opening bracket. Push to stack. Stack: [${stack.join('')}]`,
        variables: { char: ch, action: 'push', stackSize: stack.length },
        phase: `Push '${ch}'`,
      }));
    } else {
      const top = stack[stack.length - 1];
      if (!top || top !== matching[ch]) {
        valid = false;
        const st = stack.map(c => ({ value: c, state: 'error' }));
        frames.push(stackSnap(st, input, null, i, {
          message: `'${ch}' expected to match '${matching[ch]}' but stack top is '${top || 'empty'}'. INVALID!`,
          variables: { char: ch, expected: matching[ch], got: top || 'none' },
          phase: '✗ Invalid!',
        }));
        break;
      } else {
        stack.pop();
        const st = stack.map((c, k) => ({ value: c, state: k === stack.length - 1 ? 'matched' : 'default' }));
        frames.push(stackSnap(st, input, null, i, {
          message: `'${ch}' matches '${top}'. Pop stack. Stack: [${stack.join('')}]`,
          variables: { char: ch, matched: top, stackSize: stack.length },
          phase: `Match '${ch}'↔'${top}'`,
        }));
      }
    }
  }

  if (valid) {
    const isEmpty = stack.length === 0;
    frames.push(stackSnap([], str.split('').map(c => ({ value: c, state: isEmpty ? 'matched' : 'error' })), null, null, {
      message: isEmpty
        ? `Stack empty. All brackets matched. String "${str}" is VALID.`
        : `Stack not empty: [${stack.join('')}]. INVALID — unmatched opening brackets.`,
      variables: { valid: isEmpty },
      phase: isEmpty ? '✓ Valid!' : '✗ Invalid!',
    }));
  }
  return frames;
}

// ─── Min Stack ────────────────────────────────────────────────────────────────
export function generateMinStackFrames(operations = [
  ['push',3],['push',1],['push',2],['getMin'],['pop'],['getMin'],['push',0],['getMin'],
]) {
  const frames = [];
  let stack = [], minStack = [];

  frames.push(stackSnap([], null, null, null, {
    message: `Min Stack: supports push, pop, getMin in O(1). Use auxiliary min stack.`,
    phase: 'Initialize',
  }, []));

  for (const op of operations) {
    if (op[0] === 'push') {
      const val = op[1];
      stack.push(val);
      const newMin = minStack.length === 0 ? val : Math.min(val, minStack[minStack.length - 1].value);
      minStack.push(newMin);

      const st  = stack.map((v, k) => ({ value: v, state: k === stack.length - 1 ? 'pushed' : 'default' }));
      const ms  = minStack.map((v, k) => ({ value: v, state: k === minStack.length - 1 ? 'top' : 'default' }));

      frames.push(stackSnap(st, null, null, null, {
        message: `Push ${val}. Min of everything so far = ${newMin}. Push ${newMin} to min stack.`,
        variables: { pushed: val, currentMin: newMin },
        phase: `Push ${val}`,
        stackLabel: 'Main Stack',
      }, ms));

    } else if (op[0] === 'pop') {
      const popped = stack.pop();
      const poppedMin = minStack.pop();

      const st = stack.map((v, k) => ({ value: v, state: k === stack.length - 1 ? 'top' : 'default' }));
      const ms = minStack.map((v, k) => ({ value: v, state: k === minStack.length - 1 ? 'top' : 'default' }));

      frames.push(stackSnap(st, null, null, null, {
        message: `Pop ${popped}. Also pop min stack (was ${poppedMin}). New min = ${minStack.length > 0 ? minStack[minStack.length-1] : 'none'}.`,
        variables: { popped, currentMin: minStack.length > 0 ? minStack[minStack.length-1] : '-' },
        phase: `Pop ${popped}`,
        stackLabel: 'Main Stack',
      }, ms));

    } else if (op[0] === 'getMin') {
      const min = minStack[minStack.length - 1];
      const st  = stack.map(v => ({ value: v, state: 'default' }));
      const ms  = minStack.map((v, k) => ({ value: v, state: k === minStack.length - 1 ? 'found' : 'default' }));

      frames.push(stackSnap(st, null, null, null, {
        message: `getMin() → peek top of min stack = ${min}. O(1) operation!`,
        variables: { min },
        phase: `getMin = ${min}`,
        stackLabel: 'Main Stack',
      }, ms));
    }
  }
  return frames;
}

// ─── Monotonic Stack (Largest Rectangle in Histogram) ─────────────────────────
export function generateLargestRectangleFrames(heights = [2, 1, 5, 6, 2, 3]) {
  const frames = [];
  const n = heights.length;
  let maxArea = 0;
  let maxLeft = 0, maxRight = 0;
  const stack = []; // stores indices

  frames.push(stackSnap([], heights.map(v => ({ value: v, state: 'default' })), null, null, {
    message: `Largest Rectangle in Histogram: heights=[${heights.join(',')}]. Use monotonic increasing stack.`,
    phase: 'Initialize',
  }));

  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];

    while (stack.length > 0 && h < heights[stack[stack.length - 1]]) {
      const idx  = stack.pop();
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      const area  = heights[idx] * width;

      if (area > maxArea) {
        maxArea = area;
        maxLeft  = stack.length === 0 ? 0 : stack[stack.length - 1] + 1;
        maxRight = i - 1;
      }

      const input = heights.map((v, k) => ({
        value: v,
        state: k >= (stack.length === 0 ? 0 : stack[stack.length-1]+1) && k < i ? 'in-window'
          : k === idx ? 'pivot'
          : k < i ? 'processed' : 'default',
      }));
      const st = stack.map(si => ({ value: heights[si], state: 'default' }));

      frames.push(stackSnap(st, input, null, i < n ? i : null, {
        message: `Height ${heights[idx]} popped. Width = ${width}. Area = ${heights[idx]}×${width} = ${area}. Max area so far = ${maxArea}.`,
        variables: { height: heights[idx], width, area, maxArea },
        phase: `Area = ${area}`,
      }));
    }

    if (i < n) {
      stack.push(i);
      const input = heights.map((v, k) => ({
        value: v,
        state: k === i ? 'pushed' : stack.slice(0,-1).includes(k) ? 'in-window' : k < i ? 'processed' : 'default',
      }));
      const st = stack.map(si => ({ value: heights[si], state: si === i ? 'top' : 'default' }));

      frames.push(stackSnap(st, input, null, i, {
        message: `Push index ${i} (height=${heights[i]}) onto stack. Stack maintains increasing order.`,
        variables: { pushed: heights[i], index: i },
        phase: `Push ${heights[i]}`,
      }));
    }
  }

  const finalInput = heights.map((v, k) => ({
    value: v,
    state: k >= maxLeft && k <= maxRight ? 'found' : 'processed',
  }));
  frames.push(stackSnap([], finalInput, null, null, {
    message: `Largest rectangle area = ${maxArea} (columns ${maxLeft}..${maxRight}).`,
    variables: { maxArea, from: maxLeft, to: maxRight },
    phase: 'Done!',
  }));
  return frames;
}
