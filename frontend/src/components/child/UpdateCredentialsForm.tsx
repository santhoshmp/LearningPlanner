import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Key, User, Eye, EyeOff } from 'lucide-react';
import { ChildProfile, UpdateChildCredentialsData } from '../../types/child';
import { childProfileApi } from '../../services/api';
import toast from 'react-hot-toast';

const updateCredentialsSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  pin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers')
    .optional()
    .or(z.literal('')),
  confirmPin: z.string().optional(),
}).refine((data) => {
  if (data.pin && data.confirmPin) {
    return data.pin === data.confirmPin;
  }
  return true;
}, {
  message: "PINs don't match",
  path: ["confirmPin"],
}).refine((data) => {
  return data.username || data.pin;
}, {
  message: "At least one field must be updated",
  path: ["username"],
});

type UpdateCredentialsFormData = z.infer<typeof updateCredentialsSchema>;

interface UpdateCredentialsFormProps {
  child: ChildProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateCredentialsForm: React.FC<UpdateCredentialsFormProps> = ({
  child,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateCredentialsFormData>({
    resolver: zodResolver(updateCredentialsSchema),
  });

  const pinValue = watch('pin');

  // Reset form when child changes
  React.useEffect(() => {
    if (child) {
      reset({
        username: child.username,
        pin: '',
        confirmPin: '',
      });
    }
  }, [child, reset]);

  const onSubmit = async (data: UpdateCredentialsFormData) => {
    if (!child) return;

    try {
      // Only send fields that have values
      const updateData: UpdateChildCredentialsData = {};
      if (data.username && data.username !== child.username) {
        updateData.username = data.username;
      }
      if (data.pin) {
        updateData.pin = data.pin;
      }

      // Check if there's actually something to update
      if (Object.keys(updateData).length === 0) {
        toast.error('No changes to update');
        return;
      }

      await childProfileApi.updateChildCredentials(child.id, updateData);
      toast.success('Credentials updated successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update credentials';
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Update {child.name}'s Credentials
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Key className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Update Login Credentials
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Leave fields empty if you don't want to change them.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter new username (optional)"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Current username: <span className="font-medium">{child.username}</span>
              </p>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                New PIN (4 digits)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('pin')}
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.pin ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter new PIN (optional)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.pin && (
                <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>
              )}
            </div>

            {pinValue && (
              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700">
                  Confirm New PIN
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPin')}
                    type={showConfirmPin ? 'text' : 'password'}
                    maxLength={4}
                    className={`block w-full pl-10 pr-10 py-2 border ${
                      errors.confirmPin ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="Confirm new PIN"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPin && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPin.message}</p>
                )}
              </div>
            )}
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
                'Update Credentials'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCredentialsForm;