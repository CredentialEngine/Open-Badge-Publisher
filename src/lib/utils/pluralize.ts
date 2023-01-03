export const pluralize = (count: number, noun: string, suffix = 's') => {
	return `${noun}${count !== 1 ? suffix : ''}`;
};

export const pluralizeFrom = (count: number, zero: string, one: string, multi: string): string => {
	if (count == 0) return zero;
	else if (count == 1) return one;
	return multi;
};
