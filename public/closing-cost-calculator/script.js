const form = document.querySelector("#calculatorForm");
const moneyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-CA", {
  style: "percent",
  maximumFractionDigits: 1,
});

const ids = [
  "clientName",
  "agentName",
  "agentPhone",
  "agentEmail",
  "purchasePrice",
  "assessedValue",
  "downPayment",
  "downPaymentPercent",
  "depositPaid",
  "transferTaxRate",
  "propertyType",
  "addInsuranceToMortgage",
  "legalFee",
  "titleInsurance",
  "inspection",
  "appraisal",
  "otherAdjustments",
  "propaneFill",
  "oilFill",
  "movingSetup",
  "miscCushion",
  "annualTaxLevy",
  "closingDate",
  "useSaleEquity",
  "salePrice",
  "mortgagePayout",
  "sellerCommission",
  "sellerCommissionPercent",
  "sellerCommissionHstRate",
  "sellerLegalFee",
  "mortgagePenalty",
  "sellerTaxAdjustment",
  "sellerOtherCosts",
  "equityApplied",
  "hstRate",
  "newHousingRebate",
  "insuranceTaxRate",
  "lenderFee",
];

const fields = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));
let downPaymentSource = "percent";
let sellerCommissionSource = "percent";
let equityAppliedSource = "auto";

function value(id) {
  const field = fields[id];
  if (field.type === "checkbox") return field.checked;
  if (["text", "tel", "email", "date"].includes(field.type) || field.tagName === "SELECT") return field.value;
  return Number(field.value) || 0;
}

function money(amount) {
  return moneyFormatter.format(Math.round(amount || 0));
}

function roundToCents(amount) {
  return Math.round((amount || 0) * 100) / 100;
}

function syncDownPayment(changedFieldId) {
  const purchasePrice = value("purchasePrice");
  const downPayment = value("downPayment");
  const downPaymentPercent = value("downPaymentPercent");

  if (changedFieldId === "downPayment") {
    downPaymentSource = "amount";
  }

  if (changedFieldId === "downPaymentPercent") {
    downPaymentSource = "percent";
  }

  if (changedFieldId === "purchasePrice" && downPaymentSource === "amount") {
    fields.downPaymentPercent.value = purchasePrice > 0 ? roundToCents((downPayment / purchasePrice) * 100) : 0;
    return;
  }

  if (downPaymentSource === "percent" || changedFieldId === "purchasePrice") {
    fields.downPayment.value = roundToCents(purchasePrice * (downPaymentPercent / 100));
    return;
  }

  fields.downPaymentPercent.value = purchasePrice > 0 ? roundToCents((downPayment / purchasePrice) * 100) : 0;
}

function syncSellerCommission(changedFieldId) {
  const salePrice = value("salePrice");
  const commission = value("sellerCommission");
  const commissionPercent = value("sellerCommissionPercent");

  if (changedFieldId === "sellerCommission") {
    sellerCommissionSource = "amount";
  }

  if (changedFieldId === "sellerCommissionPercent") {
    sellerCommissionSource = "percent";
  }

  if (changedFieldId === "salePrice" && sellerCommissionSource === "amount") {
    fields.sellerCommissionPercent.value = salePrice > 0 ? roundToCents((commission / salePrice) * 100) : 0;
    return;
  }

  if (sellerCommissionSource === "percent" || changedFieldId === "salePrice") {
    fields.sellerCommission.value = roundToCents(salePrice * (commissionPercent / 100));
    return;
  }

  fields.sellerCommissionPercent.value = salePrice > 0 ? roundToCents((commission / salePrice) * 100) : 0;
}

function mortgageInsuranceRate(loanToValue) {
  if (loanToValue <= 0.8) return 0;
  if (loanToValue <= 0.85) return 0.028;
  if (loanToValue <= 0.9) return 0.031;
  if (loanToValue <= 0.95) return 0.04;
  return null;
}

function daysInYear(year) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

function buyerTaxLevyShare(annualTaxLevy, closingDateValue) {
  if (!closingDateValue || annualTaxLevy <= 0) return 0;

  const [year, month, day] = closingDateValue.split("-").map(Number);
  const closingDate = new Date(year, month - 1, day);
  if (Number.isNaN(closingDate.getTime())) return 0;

  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((closingDate - startOfYear) / 86400000) + 1;
  const buyerDays = Math.max(daysInYear(year) - dayOfYear + 1, 0);

  return annualTaxLevy * (buyerDays / daysInYear(year));
}

function sellerNetEquity() {
  if (value("salePrice") <= 0) return 0;

  const commission = value("sellerCommission");
  const commissionHst = commission * (value("sellerCommissionHstRate") / 100);

  return (
    value("salePrice") -
    value("mortgagePayout") -
    commission -
    commissionHst -
    value("sellerLegalFee") -
    value("mortgagePenalty") -
    value("sellerOtherCosts") +
    value("sellerTaxAdjustment")
  );
}

function purchaseCashBeforeEquity() {
  const purchasePrice = value("purchasePrice");
  const assessedValue = value("assessedValue");
  const downPayment = value("downPayment");
  const depositPaid = value("depositPaid");
  const transferTaxBase = Math.max(purchasePrice, assessedValue);
  const transferTax = transferTaxBase * (value("transferTaxRate") / 100);
  const baseMortgage = Math.max(purchasePrice - downPayment, 0);
  const loanToValue = purchasePrice > 0 ? baseMortgage / purchasePrice : 0;
  const insuranceRate = mortgageInsuranceRate(loanToValue);
  const insurancePremium = insuranceRate === null ? 0 : baseMortgage * insuranceRate;
  const insuranceTax = insurancePremium * (value("insuranceTaxRate") / 100);
  const hstOnNewBuild =
    value("propertyType") === "new"
      ? Math.max(purchasePrice * (value("hstRate") / 100) - value("newHousingRebate"), 0)
      : 0;
  const insurancePaidAtClose = value("addInsuranceToMortgage") ? 0 : insurancePremium;
  const taxLevyShare = buyerTaxLevyShare(value("annualTaxLevy"), value("closingDate"));

  return (
    downPayment -
    depositPaid +
    transferTax +
    value("legalFee") +
    value("titleInsurance") +
    taxLevyShare +
    value("otherAdjustments") +
    value("propaneFill") +
    value("oilFill") +
    hstOnNewBuild +
    insurancePaidAtClose +
    insuranceTax +
    value("lenderFee")
  );
}

function syncEquityApplied(changedFieldId) {
  if (changedFieldId === "equityApplied") {
    equityAppliedSource = "manual";
    return;
  }

  if (changedFieldId === "useSaleEquity") {
    equityAppliedSource = value("useSaleEquity") ? "auto" : "manual";
  }

  if (!value("useSaleEquity")) {
    fields.equityApplied.value = 0;
    return;
  }

  if (equityAppliedSource === "auto") {
    fields.equityApplied.value = roundToCents(
      Math.min(Math.max(sellerNetEquity(), 0), Math.max(purchaseCashBeforeEquity(), 0))
    );
  }
}

function calculate() {
  const purchasePrice = value("purchasePrice");
  const assessedValue = value("assessedValue");
  const downPayment = value("downPayment");
  const depositPaid = value("depositPaid");
  const transferTaxBase = Math.max(purchasePrice, assessedValue);
  const transferTax = transferTaxBase * (value("transferTaxRate") / 100);
  const baseMortgage = Math.max(purchasePrice - downPayment, 0);
  const loanToValue = purchasePrice > 0 ? baseMortgage / purchasePrice : 0;
  const insuranceRate = mortgageInsuranceRate(loanToValue);
  const insurancePremium = insuranceRate === null ? 0 : baseMortgage * insuranceRate;
  const insuranceTax = insurancePremium * (value("insuranceTaxRate") / 100);
  const hstOnNewBuild =
    value("propertyType") === "new"
      ? Math.max(purchasePrice * (value("hstRate") / 100) - value("newHousingRebate"), 0)
      : 0;
  const insurancePaidAtClose = value("addInsuranceToMortgage") ? 0 : insurancePremium;
  const mortgageAmount = baseMortgage + (value("addInsuranceToMortgage") ? insurancePremium : 0);
  const taxLevyShare = buyerTaxLevyShare(value("annualTaxLevy"), value("closingDate"));
  const netSaleEquity = sellerNetEquity();
  const equityApplied = value("useSaleEquity")
    ? Math.min(value("equityApplied"), Math.max(netSaleEquity, 0), Math.max(purchaseCashBeforeEquity(), 0))
    : 0;

  const closingLineItems = [
    ["Down payment amount", downPayment],
    ["Purchase deposit credited", -depositPaid],
    ["Sale equity applied to purchase", -equityApplied],
    ["Real property transfer tax", transferTax],
    ["Legal fee", value("legalFee")],
    ["Title insurance", value("titleInsurance")],
    ["Buyer share of tax levy", taxLevyShare],
    ["Condo / utility adjustments", value("otherAdjustments")],
    ["Propane fill at closing", value("propaneFill")],
    ["Oil fill at closing", value("oilFill")],
    ["HST on new build", hstOnNewBuild],
    ["Mortgage insurance paid upfront", insurancePaidAtClose],
    ["Mortgage insurance tax", insuranceTax],
    ["Lender fee", value("lenderFee")],
  ];

  const otherBuyerLineItems = [
    ["Inspection", value("inspection")],
    ["Appraisal", value("appraisal")],
    ["Moving / setup", value("movingSetup")],
    ["Extra cushion", value("miscCushion")],
  ];

  const cashBeforeEquity = purchaseCashBeforeEquity();
  const cashNeeded = cashBeforeEquity - equityApplied;
  const closingCosts = cashBeforeEquity - downPayment + depositPaid;
  const otherBuyerCosts = otherBuyerLineItems.reduce((sum, [, amount]) => sum + amount, 0);
  const sellerCommissionHst = value("sellerCommission") * (value("sellerCommissionHstRate") / 100);
  const sellerLineItems =
    value("salePrice") > 0
      ? [
          ["Sale price", value("salePrice")],
          ["Mortgage payout", -value("mortgagePayout")],
          ["Realtor commission", -value("sellerCommission")],
          ["HST on commission", -sellerCommissionHst],
          ["Seller legal / discharge", -value("sellerLegalFee")],
          ["Mortgage penalty", -value("mortgagePenalty")],
          ["Seller tax credit / debit", value("sellerTaxAdjustment")],
          ["Other selling costs", -value("sellerOtherCosts")],
        ]
      : [];

  return {
    clientName: value("clientName").trim() || "Client",
    purchasePrice,
    downPayment,
    depositPaid,
    transferTax,
    taxLevyShare,
    insurancePremium,
    insuranceRate,
    loanToValue,
    mortgageAmount,
    cashNeeded,
    closingCosts,
    otherBuyerCosts,
    netSaleEquity,
    equityApplied,
    closingLineItems,
    otherBuyerLineItems,
    sellerLineItems,
    highRatioWarning: insuranceRate === null && loanToValue > 0.95,
  };
}

function render() {
  const result = calculate();
  const agentName = value("agentName").trim();
  const agentPhone = value("agentPhone").trim();
  const agentEmail = value("agentEmail").trim();

  document.querySelector("#agentPrintName").textContent = agentName || "Your name";
  document.querySelector("#agentPrintPhone").textContent = agentPhone;
  document.querySelector("#agentPrintEmail").textContent = agentEmail;
  document.querySelector("#clientLabel").textContent = `${result.clientName} estimate`;
  document.querySelector("#cashNeeded").textContent = money(result.cashNeeded);
  document.querySelector("#closingCosts").textContent = money(result.closingCosts);
  document.querySelector("#otherBuyerCosts").textContent = money(result.otherBuyerCosts);
  document.querySelector("#sellerNetEquity").textContent = money(result.netSaleEquity);
  document.querySelector("#equityUsed").textContent = money(result.equityApplied);
  document.querySelector("#mortgageAmount").textContent = money(result.mortgageAmount);
  document.querySelector("#insurancePremium").textContent = result.highRatioWarning
    ? "Review"
    : money(result.insurancePremium);
  document.querySelector("#ltv").textContent = percentFormatter.format(result.loanToValue || 0);
  document.querySelector("#taxLevySharePreview").textContent = money(result.taxLevyShare);
  document.querySelector("#sellerNetPreview").textContent = money(result.netSaleEquity);

  const list = document.querySelector("#breakdownList");
  list.innerHTML = "";
  result.closingLineItems
    .filter(([, amount]) => Math.abs(amount) > 0.49)
    .forEach(([label, amount]) => {
      const row = document.createElement("div");
      row.className = "line-item";

      const term = document.createElement("dt");
      term.textContent = label;
      const definition = document.createElement("dd");
      definition.textContent = money(amount);

      row.append(term, definition);
      list.append(row);
    });

  result.otherBuyerLineItems
    .filter(([, amount]) => Math.abs(amount) > 0.49)
    .forEach(([label, amount]) => {
      const row = document.createElement("div");
      row.className = "line-item secondary";

      const term = document.createElement("dt");
      term.textContent = `${label} (other buyer cost)`;
      const definition = document.createElement("dd");
      definition.textContent = money(amount);

      row.append(term, definition);
      list.append(row);
    });

  result.sellerLineItems
    .filter(([, amount]) => Math.abs(amount) > 0.49)
    .forEach(([label, amount]) => {
      const row = document.createElement("div");
      row.className = "line-item seller";

      const term = document.createElement("dt");
      term.textContent = `${label} (seller)`;
      const definition = document.createElement("dd");
      definition.textContent = money(amount);

      row.append(term, definition);
      list.append(row);
    });

  if (result.highRatioWarning) {
    const row = document.createElement("div");
    row.className = "line-item warning";
    const term = document.createElement("dt");
    term.textContent = "Mortgage insurance";
    const definition = document.createElement("dd");
    definition.textContent = "Down payment below 5%";
    row.append(term, definition);
    list.append(row);
  }
}

function summaryText() {
  const result = calculate();
  const agentName = value("agentName").trim();
  const agentPhone = value("agentPhone").trim();
  const agentEmail = value("agentEmail").trim();
  const contactLines = [
    "Prepared by EXIT Realty Associates",
    agentName ? `Agent: ${agentName}` : "",
    agentPhone ? `Phone: ${agentPhone}` : "",
    agentEmail ? `Email: ${agentEmail}` : "",
    "",
  ].filter((line, index, lines) => line || (index === lines.length - 1 && lines.some(Boolean)));

  const lines = [
    ...contactLines,
    `${result.clientName} buying cost estimate`,
    `Purchase price: ${money(result.purchasePrice)}`,
    `Down payment: ${money(result.downPayment)}`,
    `Deposit already paid: ${money(result.depositPaid)}`,
    `Estimated cash to bring to lawyer: ${money(result.cashNeeded)}`,
    `Estimated closing costs only: ${money(result.closingCosts)}`,
    `Other buyer costs not usually paid to lawyer: ${money(result.otherBuyerCosts)}`,
    `Estimated seller net equity: ${money(result.netSaleEquity)}`,
    `Sale equity applied to purchase: ${money(result.equityApplied)}`,
    `Estimated mortgage amount: ${money(result.mortgageAmount)}`,
    `Buyer share of tax levy: ${money(result.taxLevyShare)}`,
    `Mortgage insurance premium: ${result.highRatioWarning ? "Review with lender" : money(result.insurancePremium)}`,
    "",
    "Breakdown:",
    ...result.closingLineItems
      .filter(([, amount]) => Math.abs(amount) > 0.49)
      .map(([label, amount]) => `- ${label}: ${money(amount)}`),
    ...result.otherBuyerLineItems
      .filter(([, amount]) => Math.abs(amount) > 0.49)
      .map(([label, amount]) => `- ${label} (other buyer cost): ${money(amount)}`),
    ...result.sellerLineItems
      .filter(([, amount]) => Math.abs(amount) > 0.49)
      .map(([label, amount]) => `- ${label} (seller): ${money(amount)}`),
  ];
  return lines.join("\n");
}

form.addEventListener("input", (event) => {
  if (["purchasePrice", "downPayment", "downPaymentPercent"].includes(event.target.id)) {
    syncDownPayment(event.target.id);
  }
  if (["salePrice", "sellerCommission", "sellerCommissionPercent"].includes(event.target.id)) {
    syncSellerCommission(event.target.id);
  }
  if (
    [
      "useSaleEquity",
      "salePrice",
      "mortgagePayout",
      "sellerCommission",
      "sellerCommissionPercent",
      "sellerCommissionHstRate",
      "sellerLegalFee",
      "mortgagePenalty",
      "sellerTaxAdjustment",
      "sellerOtherCosts",
      "equityApplied",
      "purchasePrice",
      "downPayment",
      "downPaymentPercent",
      "depositPaid",
      "transferTaxRate",
      "legalFee",
      "titleInsurance",
      "otherAdjustments",
      "propaneFill",
      "oilFill",
      "annualTaxLevy",
      "closingDate",
      "hstRate",
      "newHousingRebate",
      "insuranceTaxRate",
      "lenderFee",
    ].includes(event.target.id)
  ) {
    syncEquityApplied(event.target.id);
  }
  render();
});
document.querySelector("#printSummary").addEventListener("click", () => window.print());
document.querySelector("#copySummary").addEventListener("click", async () => {
  const button = document.querySelector("#copySummary");
  await navigator.clipboard.writeText(summaryText());
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = "Copy";
  }, 1200);
});

syncDownPayment("downPaymentPercent");
syncSellerCommission("sellerCommissionPercent");
syncEquityApplied("init");
render();
