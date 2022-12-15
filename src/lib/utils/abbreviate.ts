const abbreviate = (str: string, n = 60) => (str.length > n ? str.slice(0, n - 1) + '…' : str);
export default abbreviate;
