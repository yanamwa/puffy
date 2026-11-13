import Swal from "sweetalert2";

export default async function confirmLogout() {
  const result = await Swal.fire({
    title: "Log out?",
    text: "Are you sure you want to log out?",
    showCancelButton: true,
    confirmButtonText: "Yes, log out",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: "logout-confirm-dialog",
      title: "logout-confirm-title",
      htmlContainer: "logout-confirm-text",
      actions: "logout-confirm-actions",
      confirmButton: "logout-confirm-accept",
      cancelButton: "logout-confirm-cancel",
    },
  });

  return result.isConfirmed;
}
