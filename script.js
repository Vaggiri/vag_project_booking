// Replace the placeholder below with your Formspree form endpoint.
// e.g., const FORMSPREE_ENDPOINT = "https://formspree.io/f/mayabcd";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/yourFormID";

document.addEventListener('DOMContentLoaded', function() {
  const yearSpan = document.getElementById('year');
  yearSpan.textContent = new Date().getFullYear();

  const uploadTrigger = document.getElementById('uploadLogoTrigger');
  const logoUpload = document.getElementById('logoUpload');
  const logoImg = document.getElementById('logoImg');
  const logoPlaceholder = document.getElementById('logoPlaceholder');

  uploadTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    logoUpload.click();
  });

  logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      logoImg.src = ev.target.result;
      logoImg.style.display = 'block';
      logoPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // Conditional fields
  const ideaYes = document.getElementById('ideaYes');
  const ideaNo = document.getElementById('ideaNo');
  const themeBlock = document.getElementById('themeBlock');
  function toggleIdea() {
    if (ideaNo.checked) {
      themeBlock.style.display = 'block';
    } else {
      themeBlock.style.display = 'none';
    }
    updateProgress();
  }
  ideaYes.addEventListener('change', toggleIdea);
  ideaNo.addEventListener('change', toggleIdea);

  // Domain validation
  const domainCheckboxes = document.querySelectorAll('.domain-checkbox');
  const domainError = document.getElementById('domainError');

  // Form handling
  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitBtnText = document.getElementById('submitBtnText');
  const msgBox = document.getElementById('msgBox');
  const formProgress = document.getElementById('formProgress');

  function updateProgress() {
    // simple heuristic for progress based on filled fields
    let total = 7;
    let filled = 0;
    if (document.getElementById('fullName').value.trim()) filled++;
    if (document.getElementById('email').value.trim()) filled++;
    if (document.getElementById('whatsapp').value.trim()) filled++;
    if ([...domainCheckboxes].some(cb => cb.checked)) filled++;
    if (document.getElementById('description').value.trim()) filled++;
    if (document.getElementById('projectTitle').value.trim()) filled++;
    if (document.getElementById('budget').value) filled++;
    const pct = Math.min(100, Math.round((filled/total)*100));
    formProgress.style.width = pct + '%';
  }

  form.addEventListener('input', updateProgress);
  updateProgress();

  // Client-side validation helper
  function validateDomains() {
    if ([...domainCheckboxes].some(cb => cb.checked)) {
      domainError.style.display = 'none';
      return true;
    } else {
      domainError.style.display = 'block';
      return false;
    }
  }

  // Handle submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgBox.style.display = 'none';
    msgBox.innerHTML = '';

    // Bootstrap validation
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      validateDomains();
      return;
    }

    if (!validateDomains()) {
      return;
    }

    // Prepare FormData
    const fd = new FormData();

    fd.append('name', document.getElementById('fullName').value.trim());
    fd.append('_replyto', document.getElementById('email').value.trim());
    fd.append('whatsapp', document.getElementById('whatsapp').value.trim());
    fd.append('project_title', document.getElementById('projectTitle').value.trim());
    const domains = [...domainCheckboxes].filter(cb => cb.checked).map(cb => cb.value).join(', ');
    fd.append('domains', domains);
    fd.append('project_description', document.getElementById('description').value.trim());
    fd.append('idea_status', document.querySelector('input[name="idea_status"]:checked').value);
    fd.append('budget', document.getElementById('budget').value);
    if (ideaNo.checked) {
      fd.append('preferred_theme', document.getElementById('theme').value.trim());
    }

    // Attach file (logo or other)
    const attachmentEl = document.getElementById('attachment');
    if (attachmentEl.files && attachmentEl.files[0]) {
      fd.append('attachment', attachmentEl.files[0], attachmentEl.files[0].name);
    }

    // If a logo was uploaded via header logoUpload, attach it too (optional, will not duplicate if same file)
    if (logoUpload.files && logoUpload.files[0]) {
      fd.append('logo_preview', logoUpload.files[0], logoUpload.files[0].name);
    }

    // Extra hidden fields recommended by Formspree
    fd.append('_subject', `New Booking: ${document.getElementById('fullName').value.trim()} - ${document.getElementById('projectTitle').value.trim() || 'No Title'}`);
    fd.append('_format', 'plain'); // request plain text

    // UI: show spinner
    submitSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Sending...';

    try {
      // Send to Formspree
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: fd
      });

      if (res.ok) {
        // success
        msgBox.className = 'alert alert-success';
        msgBox.innerHTML = '<strong>Request sent!</strong> Thank you — we will contact you shortly via email or WhatsApp.';
        msgBox.style.display = 'block';
        form.reset();
        logoImg.src = '';
        logoImg.style.display = 'none';
        logoPlaceholder.style.display = 'block';
        form.classList.remove('was-validated');
        updateProgress();
      } else {
        // error
        let text = await res.text();
        msgBox.className = 'alert alert-danger';
        msgBox.innerHTML = '<strong>Submission failed.</strong> Please try again later or contact us directly. (' + res.status + ')';
        msgBox.style.display = 'block';
        console.error('Formspree error', res.status, text);
      }
    } catch (err) {
      msgBox.className = 'alert alert-danger';
      msgBox.innerHTML = '<strong>Network error.</strong> Please check your connection and try again.';
      msgBox.style.display = 'block';
      console.error(err);
    } finally {
      submitSpinner.style.display = 'none';
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Send Request';
    }

  });

});