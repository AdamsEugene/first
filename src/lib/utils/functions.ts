export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): {
	(...args: Parameters<T>): void;
	cancel: () => void;
} {
	let inThrottle = false;
	let lastFunc: ReturnType<typeof setTimeout>;
	let lastRan: number;

	function throttled(this: unknown, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			lastRan = Date.now();
			inThrottle = true;

			lastFunc = setTimeout(() => {
				inThrottle = false;
			}, limit);
		} else {
			// Store the latest arguments
			clearTimeout(lastFunc);
			lastFunc = setTimeout(() => {
				if (Date.now() - lastRan >= limit) {
					func.apply(this, args);
					lastRan = Date.now();
					inThrottle = false;
				}
			}, limit);
		}
	}

	throttled.cancel = function () {
		clearTimeout(lastFunc);
		inThrottle = false;
	};

	return throttled;
}
