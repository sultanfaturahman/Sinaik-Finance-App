let xlsxPromise: Promise<typeof import("xlsx")> | null = null;

export const loadXlsx = async () => {
  if (!xlsxPromise) {
    xlsxPromise = import("xlsx");
  }

  return xlsxPromise;
};
