import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Rating,
  Select,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

type MenuItem = {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
};

type FeedbackPayload = {
  day: string;
  mealType: MealType;
  foodItem: string;
  rating: number;
  comment: string;
  feedbackImageFile: File | null;
  hasFoodComplaint: boolean;
  complaintText: string;
  complaintImageFile: File | null;
};

interface FoodFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  menu: MenuItem[];
  defaultDay: string;
  onSubmit: (payload: FeedbackPayload) => Promise<{ success: boolean; message?: string }>;
}

const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const toTitle = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

const fieldSx = {
  '& .MuiInputLabel-root': {
    color: 'var(--foreground-muted)'
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'var(--focus-ring)'
  },
  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    backgroundColor: 'var(--surface)',
    px: 0.5,
    borderRadius: '4px'
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--surface-muted)',
    color: 'var(--foreground)',
    '& fieldset': {
      borderColor: 'var(--border)'
    },
    '&:hover fieldset': {
      borderColor: 'var(--border-strong)'
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--focus-ring)'
    }
  },
  '& .MuiSelect-icon': {
    color: 'var(--foreground-muted)'
  },
  '& .MuiFormHelperText-root': {
    color: 'var(--foreground-muted)'
  }
};

export default function FoodFeedbackDialog({
  open,
  onClose,
  menu,
  defaultDay,
  onSubmit
}: FoodFeedbackDialogProps) {
  const [day, setDay] = useState(defaultDay);
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [foodItem, setFoodItem] = useState('');
  const [rating, setRating] = useState<number | null>(4);
  const [comment, setComment] = useState('');
  const [feedbackImageFile, setFeedbackImageFile] = useState<File | null>(null);
  const [feedbackImagePreview, setFeedbackImagePreview] = useState<string | null>(null);
  const [hasFoodComplaint, setHasFoodComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintImageFile, setComplaintImageFile] = useState<File | null>(null);
  const [complaintImagePreview, setComplaintImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: ''
  });

  const selectedMenu = useMemo(() => menu.find((item) => item.day === day), [menu, day]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDay(defaultDay);
    setMealType('BREAKFAST');
    setRating(4);
    setComment('');
    setFeedbackImageFile(null);
    setFeedbackImagePreview(null);
    setHasFoodComplaint(false);
    setComplaintText('');
    setComplaintImageFile(null);
    setComplaintImagePreview(null);
  }, [open, defaultDay]);

  const handleFeedbackImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFeedbackImageFile(file);

    if (!file) {
      setFeedbackImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFeedbackImagePreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleComplaintImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setComplaintImageFile(file);

    if (!file) {
      setComplaintImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setComplaintImagePreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedValue =
      mealType === 'BREAKFAST'
        ? selectedMenu?.breakfast || ''
        : mealType === 'LUNCH'
          ? selectedMenu?.lunch || ''
          : selectedMenu?.dinner || '';

    setFoodItem(selectedValue);
  }, [open, selectedMenu, mealType]);

  const handleSubmit = async () => {
    if (!rating || !foodItem.trim()) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: foodItem.trim() ? 'Please choose a rating.' : 'No menu item is available for this meal.'
      });
      return;
    }

    if (hasFoodComplaint && !complaintImageFile) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Please upload or take a complaint image.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        day,
        mealType,
        foodItem: foodItem.trim(),
        rating,
        comment: comment.trim(),
        feedbackImageFile,
        hasFoodComplaint,
        complaintText: complaintText.trim(),
        complaintImageFile
      });

      if (result.success) {
        setSnackbar({ open: true, severity: 'success', message: result.message || 'Feedback submitted successfully.' });
        onClose();
      } else {
        setSnackbar({ open: true, severity: 'error', message: result.message || 'Failed to submit feedback.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(2, 6, 23, 0.6)'
            }
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'var(--surface)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: 'var(--foreground)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          Add Food Feedback
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="feedback-day-label">Day</InputLabel>
              <Select
                labelId="feedback-day-label"
                label="Day"
                value={day}
                onChange={(event) => setDay(String(event.target.value))}
              >
                {dayOrder.map((dayValue) => (
                  <MenuItem key={dayValue} value={dayValue}>
                    {toTitle(dayValue)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="feedback-meal-label">Meal Type</InputLabel>
              <Select
                labelId="feedback-meal-label"
                label="Meal Type"
                value={mealType}
                onChange={(event) => setMealType(event.target.value as MealType)}
              >
                {mealTypes.map((meal) => (
                  <MenuItem key={meal} value={meal}>
                    {toTitle(meal)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Food Item"
              value={foodItem}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
              helperText={foodItem ? 'Auto-filled from selected menu.' : 'This meal has no menu item for the selected day.'}
              sx={fieldSx}
            />

            <Box>
              <Typography variant="body2" sx={{ color: 'var(--foreground-muted)', mb: 0.5, fontWeight: 600 }}>
                Rating
              </Typography>
              <Rating
                name="feedback-rating"
                value={rating}
                onChange={(_event, value) => setRating(value)}
                size="large"
                sx={{
                  '& .MuiRating-icon': {
                    color: '#f59e0b'
                  },
                  '& .MuiRating-iconEmpty': {
                    color: 'color-mix(in srgb, var(--foreground-muted) 50%, transparent)'
                  }
                }}
              />
            </Box>

            <TextField
              label="Feedback Text (Optional)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Share your experience about the meal..."
              sx={fieldSx}
            />

            <Box
              sx={{
                p: 1.5,
                border: '1px solid var(--border)',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-muted)'
              }}
            >
              <Typography variant="body2" sx={{ color: 'var(--foreground)', mb: 0.5, fontWeight: 700 }}>
                Feedback Image (Optional)
              </Typography>
              <Button component="label" variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
                Upload Feedback Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFeedbackImageChange}
                />
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'var(--foreground-muted)' }}>
                {feedbackImageFile ? `Selected: ${feedbackImageFile.name}` : 'No image selected'}
              </Typography>

              {feedbackImagePreview && (
                <Box
                  component="img"
                  src={feedbackImagePreview}
                  alt="Feedback image preview"
                  sx={{
                    mt: 1.2,
                    maxHeight: 180,
                    width: '100%',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid var(--border)'
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                p: 1.5,
                border: '1px solid var(--border)',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-muted)'
              }}
            >
              <Typography variant="body2" sx={{ color: 'var(--foreground)', mb: 0.5, fontWeight: 700 }}>
                Food Complaint
              </Typography>
              <RadioGroup
                row
                value={hasFoodComplaint ? 'YES' : 'NO'}
                onChange={(event) => {
                  const next = event.target.value === 'YES';
                  setHasFoodComplaint(next);
                  if (!next) {
                    setComplaintText('');
                    setComplaintImageFile(null);
                    setComplaintImagePreview(null);
                  }
                }}
              >
                <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                <FormControlLabel value="NO" control={<Radio />} label="No" />
              </RadioGroup>

              {hasFoodComplaint && (
                <Box sx={{ mt: 1.5, display: 'grid', gap: 1.5 }}>
                  <TextField
                    label="Complaint Details (Optional)"
                    value={complaintText}
                    onChange={(event) => setComplaintText(event.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Describe the food complaint..."
                    sx={fieldSx}
                  />

                  <Box>
                    <Button component="label" variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
                      Upload or Take Photo
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleComplaintImageChange}
                      />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'var(--foreground-muted)' }}>
                      {complaintImageFile ? `Selected: ${complaintImageFile.name}` : 'No image selected'}
                    </Typography>
                  </Box>

                  {complaintImagePreview && (
                    <Box
                      component="img"
                      src={complaintImagePreview}
                      alt="Complaint evidence preview"
                      sx={{
                        maxHeight: 180,
                        width: '100%',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid var(--border)' }}>
          <Button onClick={onClose} sx={{ color: 'var(--foreground-muted)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !foodItem.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 2,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)'
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
