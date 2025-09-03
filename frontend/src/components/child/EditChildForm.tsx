import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Calendar, GraduationCap, Brain } from 'lucide-react';
import { ChildProfile, UpdateChildProfileData, LEARNING_STYLES } from '../../types/child';
import { childProfileApi } from '../../services/api';
import { GradeSelector } from '../common';
import toast from 'react-hot-toast';

const editChildSchema = z.object({
  name: z.string().min(1, 'Child name is required').max(50, 'Name must not exceed 50 characters'),
  age: z.number().min(3, 'Child must be at least 3 years old').max(18, 'Child must be 18 years old or younger'),
  gradeLevel: z.string().min(1, 'Please select a grade level'),
  learningStyle: z.enum(['VISUAL', 'AUDITORY', 'KINESTHETIC', 'MIXED'], { required_error: 'Please select a learning style' }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'colorful']),
    soundEnabled: z.boolean(),
    animationsEnabled: z.boolean(),
    difficultyPreference: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  }),
});

type EditChildFormData = z.infer<typeof editChildSchema>;

interface EditChildFormProps {
  child: ChildProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditChildForm: React.FC<EditChildFormProps> = ({ child, isOpen, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<EditChildFormData>({
    resolver: zodResolver(editChildSchema),
  });

  const selectedLearningStyle = watch('learningStyle');

  // Reset form when child changes
  React.useEffect(() => {
    if (child) {
      reset({
        name: child.name,
        age: child.age,
        gradeLevel: child.gradeLevel as any,
        learningStyle: child.learningStyle,
        preferences: child.preferences,
      });
    }
  }, [child, reset]);

  const onSubmit = async (data: EditChildFormData) => {
    if (!child) return;

    try {
      await childProfileApi.updateChild(child.id, data as UpdateChildProfileData);
      toast.success('Child profile updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update child profile';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !child) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit {child.name}'s Profile</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Child's Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter child's name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  {...register('age', { valueAsNumber: true })}
                  type="number"
                  min="3"
                  max="18"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.age ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Age"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>
            </div>

            <div>
              <GradeSelector
                value={watch('gradeLevel') || ''}
                onChange={(value) => setValue('gradeLevel', value)}
                label="Grade Level"
                required
                error={!!errors.gradeLevel}
                helperText={errors.gradeLevel?.message}
                showAgeRange
                fullWidth
                size="medium"
              />
            </div>
          </div>

          {/* Learning Style */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Learning Style
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEARNING_STYLES.map((style) => (
                <label
                  key={style.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedLearningStyle === style.value
                      ? 'border-indigo-600 ring-2 ring-indigo-600'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    {...register('learningStyle')}
                    type="radio"
                    value={style.value}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        {style.label}
                      </span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">
                        {style.description}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.learningStyle && (
              <p className="mt-1 text-sm text-red-600">{errors.learningStyle.message}</p>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select
                  {...register('preferences.theme')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="colorful">Colorful</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label htmlFor="difficultyPreference" className="block text-sm font-medium text-gray-700">
                  Difficulty Preference
                </label>
                <select
                  {...register('preferences.difficultyPreference')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="adaptive">Adaptive</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...register('preferences.soundEnabled')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable sound effects
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('preferences.animationsEnabled')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable animations
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditChildForm;