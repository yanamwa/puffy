function filename(value) {
  return `${String(value || "report").replace(/[<>:"/\\|?*]/g, "-")}.pdf`;
}

export async function downloadEnrollmentPdf(students, name) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const pdf = new jsPDF({ orientation: "landscape" });
  autoTable(pdf, {
    head: [["Student ID", "Name", "Email", "Year Level", "Section"]],
    body: students.length
      ? students.map((student) => [
          student.studentId || "N/A",
          student.displayName || student.name || "Student",
          student.email || "N/A",
          student.yearLevel || "N/A",
          student.sectionName || "N/A",
        ])
      : [["No enrolled students.", "", "", "", ""]],
    margin: 12,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [89, 89, 89] },
  });
  pdf.save(filename(name));
}

export async function downloadAssessmentPdf(name) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  window.dispatchEvent(new Event("beforeprint"));
  try {
    await document.fonts.ready;
    const report = document.querySelector(".qa-print-report");
    if (!report)
      throw new Error("No assessment report is available to download.");
    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth() - 24;
    const height = pdf.internal.pageSize.getHeight() - 24;
    let first = true;
    // Capture each report section separately to keep long reports within canvas limits.
    const sections = [...report.querySelectorAll("section")].filter(
      (section) =>
        !section.querySelector("section") &&
        section.getBoundingClientRect().height > 0,
    );
    for (const section of sections.length ? sections : [report]) {
      const canvas = await html2canvas(section, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        onclone: (doc) => {
          doc
            .querySelectorAll(
              '.qa-print-report button, .qa-print-report select, .qa-print-report [aria-label="Analysis view"], .qa-print-report [aria-label="Assessment analysis view"]',
            )
            .forEach((node) => {
              node.style.display = "none";
            });
          doc.querySelectorAll(".qa-print-report div").forEach((node) => {
            node.style.maxHeight = "none";
            node.style.overflow = "visible";
          });
        },
      });
      const sliceHeight = Math.max(
        1,
        Math.floor((height * canvas.width) / width),
      );
      for (let top = 0; top < canvas.height; top += sliceHeight) {
        if (!first) pdf.addPage();
        first = false;
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = Math.min(sliceHeight, canvas.height - top);
        slice
          .getContext("2d")
          .drawImage(
            canvas,
            0,
            top,
            canvas.width,
            slice.height,
            0,
            0,
            slice.width,
            slice.height,
          );
        pdf.addImage(
          slice,
          "PNG",
          12,
          12,
          width,
          (slice.height * width) / slice.width,
        );
      }
    }
    pdf.save(filename(name));
  } finally {
    window.dispatchEvent(new Event("afterprint"));
  }
}
