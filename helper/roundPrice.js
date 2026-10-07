const roundPrice = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export default roundPrice;
