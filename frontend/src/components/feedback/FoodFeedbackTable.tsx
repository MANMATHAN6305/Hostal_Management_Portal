import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

export interface FeedbackRow {
  id: number;
  student_name: string;
  day: string;
  meal_type: string;
  food_item: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface MealStat {
  mealType: string;
  averageRating: number;
  totalFeedback: number;
}

interface FeedbackFilters {
  day: string;
  mealType: string;
  rating: string;
}

interface FoodFeedbackTableProps {
  feedback: FeedbackRow[];
  stats: MealStat[];
  filters: FeedbackFilters;
  onFilterChange: (next: FeedbackFilters) => void;
}

const dayOptions = ['', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const mealOptions = ['', 'BREAKFAST', 'LUNCH', 'DINNER'];
const ratingOptions = ['', '5', '4', '3', '2', '1'];

const toTitle = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

const selectMenuProps = {
  slotProps: {
    paper: {
      sx: {
        bgcolor: 'var(--surface)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        '& .MuiMenuItem-root': {
          color: 'var(--foreground)'
        },
        '& .MuiMenuItem-root.Mui-selected': {
          bgcolor: 'var(--surface-muted)'
        },
        '& .MuiMenuItem-root:hover': {
          bgcolor: 'var(--surface-muted)'
        }
      }
    }
  }
};

export default function FoodFeedbackTable({ feedback, stats, filters, onFilterChange }: FoodFeedbackTableProps) {
  return (
    <Box sx={{ display: 'grid', gap: 2, color: 'var(--foreground)' }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {stats.map((stat) => (
          <Card
            key={stat.mealType}
            variant="outlined"
            sx={{
              bgcolor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ color: 'var(--foreground-muted)' }}>
                {toTitle(stat.mealType)} Average
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Rating
                  value={Number(stat.averageRating) || 0}
                  precision={0.1}
                  readOnly
                  sx={{ '& .MuiRating-iconEmpty': { color: 'var(--foreground-muted)' } }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--foreground)' }}>
                  {Number(stat.averageRating || 0).toFixed(2)}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${stat.totalFeedback} feedback`}
                sx={{
                  mt: 1,
                  bgcolor: 'var(--surface-muted)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
        <FormControl
          size="small"
          fullWidth
          sx={{
            '& .MuiInputLabel-root': { color: 'var(--foreground-muted)' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'var(--foreground)' },
            '& .MuiOutlinedInput-root': {
              color: 'var(--foreground)',
              bgcolor: 'var(--surface)',
              '& fieldset': { borderColor: 'var(--border)' },
              '&:hover fieldset': { borderColor: 'var(--border-strong)' },
              '&.Mui-focused fieldset': { borderColor: 'var(--focus-ring)' }
            },
            '& .MuiSvgIcon-root': { color: 'var(--foreground-muted)' }
          }}
        >
          <InputLabel id="filter-day">Filter by Day</InputLabel>
          <Select
            labelId="filter-day"
            label="Filter by Day"
            value={filters.day}
            onChange={(event) => onFilterChange({ ...filters, day: String(event.target.value) })}
            MenuProps={selectMenuProps}
          >
            {dayOptions.map((day) => (
              <MenuItem key={day || 'ALL'} value={day}>
                {day ? toTitle(day) : 'All Days'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{
            '& .MuiInputLabel-root': { color: 'var(--foreground-muted)' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'var(--foreground)' },
            '& .MuiOutlinedInput-root': {
              color: 'var(--foreground)',
              bgcolor: 'var(--surface)',
              '& fieldset': { borderColor: 'var(--border)' },
              '&:hover fieldset': { borderColor: 'var(--border-strong)' },
              '&.Mui-focused fieldset': { borderColor: 'var(--focus-ring)' }
            },
            '& .MuiSvgIcon-root': { color: 'var(--foreground-muted)' }
          }}
        >
          <InputLabel id="filter-meal">Filter by Meal Type</InputLabel>
          <Select
            labelId="filter-meal"
            label="Filter by Meal Type"
            value={filters.mealType}
            onChange={(event) => onFilterChange({ ...filters, mealType: String(event.target.value) })}
            MenuProps={selectMenuProps}
          >
            {mealOptions.map((meal) => (
              <MenuItem key={meal || 'ALL'} value={meal}>
                {meal ? toTitle(meal) : 'All Meals'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{
            '& .MuiInputLabel-root': { color: 'var(--foreground-muted)' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'var(--foreground)' },
            '& .MuiOutlinedInput-root': {
              color: 'var(--foreground)',
              bgcolor: 'var(--surface)',
              '& fieldset': { borderColor: 'var(--border)' },
              '&:hover fieldset': { borderColor: 'var(--border-strong)' },
              '&.Mui-focused fieldset': { borderColor: 'var(--focus-ring)' }
            },
            '& .MuiSvgIcon-root': { color: 'var(--foreground-muted)' }
          }}
        >
          <InputLabel id="filter-rating">Filter by Rating</InputLabel>
          <Select
            labelId="filter-rating"
            label="Filter by Rating"
            value={filters.rating}
            onChange={(event) => onFilterChange({ ...filters, rating: String(event.target.value) })}
            MenuProps={selectMenuProps}
          >
            {ratingOptions.map((rating) => (
              <MenuItem key={rating || 'ALL'} value={rating}>
                {rating ? `${rating} Star${rating === '1' ? '' : 's'}` : 'All Ratings'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {feedback.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            bgcolor: 'var(--surface-muted)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        >
          No feedback records found for current filters.
        </Alert>
      ) : (
        <TableContainer
          sx={{
            border: '1px solid var(--border)',
            borderRadius: 2,
            bgcolor: 'var(--surface)'
          }}
        >
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'var(--surface-muted)' }}>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Day</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Meal Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Food Item</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Comment</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>Submitted Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedback.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: 'var(--surface-muted)' } }}>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{row.student_name}</TableCell>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{toTitle(row.day)}</TableCell>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{toTitle(row.meal_type)}</TableCell>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{row.food_item}</TableCell>
                  <TableCell>
                    <Rating
                      value={Number(row.rating)}
                      readOnly
                      size="small"
                      sx={{ '& .MuiRating-iconEmpty': { color: 'var(--foreground-muted)' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{row.comment || '-'}</TableCell>
                  <TableCell sx={{ color: 'var(--foreground)', borderBottomColor: 'var(--border)' }}>{new Date(row.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
