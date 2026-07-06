package com.example.productmanagement.service;

import com.example.productmanagement.entity.Role;
import com.example.productmanagement.entity.User;
import com.example.productmanagement.repository.UserRepository;
import com.example.productmanagement.util.PasswordHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User signup(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        String hashed = PasswordHasher.hash(password);
        User user = new User(username, hashed, Role.USER);
        return userRepository.save(user);
    }

    @Transactional
    public User createAdmin(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            return userRepository.findByUsername(username).get();
        }
        String hashed = PasswordHasher.hash(password);
        User user = new User(username, hashed, Role.ADMIN);
        return userRepository.save(user);
    }

    public Optional<User> login(String username, String password) {
        Optional<User> optUser = userRepository.findByUsername(username);
        if (optUser.isPresent()) {
            User user = optUser.get();
            if (PasswordHasher.verify(password, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + id + " not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot delete admin user");
        }
        userRepository.deleteById(id);
    }
}
